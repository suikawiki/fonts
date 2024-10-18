use strict;
use warnings;
use Path::Tiny;
use lib glob path (__FILE__)->parent->child ('modules/*/lib');
use JSON::PS;

my $RootPath = path (__FILE__)->parent->parent;

my $Fonts;
{
  my $path = $RootPath->child ('config/fonts.json');
  $Fonts = json_bytes2perl $path->slurp;
}

{
  my $path = $RootPath->child ('generated/fonts.css');
  $path->parent->mkpath;

  my $css = join "\n", map {
    my $v = $Fonts->{$_};
    if ($v->{type} eq 'opentype') {
      if ($v->{webfont}) {
        my $c = sprintf q{
          @font-face {
            font-family: '%s';
            src: url(../%s);
            %s
          }
        },
            $v->{font_family} // $_, $v->{path},
            ($v->{unicode_range} ? 'unicode-range: ' . $v->{unicode_range} . ';' : ''),
        ;
        $c .= sprintf q{
          @font-face {
            font-family: '%s';
            font-style: italic;
            src: url(../%s);
            %s
          }
        },
            $v->{font_family} // $_, $v->{italic_path},
            ($v->{unicode_range} ? 'unicode-range: ' . $v->{unicode_range} . ';' : ''),
            if defined $v->{italic_path};
        $c;
      } else {
        '';
      }
    } elsif ($v->{type} eq 'images' or $v->{type} eq 'bitmap' or
             $v->{type} eq 'imageset' or $v->{type} eq 'kage') {
      '';
    } else {
      die $v->{type};
    }
  } sort { $a cmp $b } keys %$Fonts;
  $css .= q{/* License: Public Domain. */};
  $path->spew_utf8 ($css);
}


{
  my $dir_path = $RootPath->child ('packref');
  $dir_path->mkpath;

  for my $key (keys %$Fonts) {
    my $v = $Fonts->{$key};

    my $def = {
      type => 'packref',
      source => {
        type => 'files',
        files => {},
      },
      #"content_license" => ...,
      "packref_license" => "CC0-1.0",
      "meta" => {
        "lang" => "en",
        "title" => $key,
        "author" => "",
        "page_url" => $v->{sw_url},
      },
    };

    my $file_key = $v->{key};
    my $p = '';
    $p = 'opentype/' if $v->{type} eq 'opentype';
    $p = 'bdf/' if $v->{type} eq 'bdf';
    for my $K (qw(path italic_path bdf_path dat_path dump_path license_path)) {
      if (defined $v->{$K}) {
        $v->{$K} =~ m{^([^/]+)/} or die "Bad path |$v->{$K}|";
        $file_key //= $1;
        $def->{source}->{files}->{"file:r:$K"}->{url} = "https://fonts.suikawiki.org/$p$v->{$K}";
      }
    }

    next unless grep { $_ ne "file:r:license_path" } keys %{$def->{source}->{files}};
    die "Bad path for |$key|" unless defined $file_key;
    die "Bad path for |$key| ($file_key)"
        unless $file_key =~ m{\A[0-9a-zA-Z][0-9a-zA-Z_.-]*\z};

    my $path = $dir_path->child ("$file_key.json");
    $path->spew (perl2json_bytes_for_record $def);

    $v->{packref_path} = "$file_key.json";
  }
}

{
  my $path = $RootPath->child ('index.html');
  $path->parent->mkpath;

  my $html = q{
<!DOCTYPE HTML>
<html lang=en>
<meta charset=utf-8>
<title>Fonts</title>
<link rel=license href="https://suika.suikawiki.org/c/pd" title="Public Domain.">
<link rel=stylesheet href="https://wiki.suikawiki.org/styles/sw">
<link rel=stylesheet href=generated/fonts.css>
<link rel=icon href="https://wiki.suikawiki.org/favicon.ico">
<meta name="viewport" content="width=device-width,initial-scale=1">
<h1>Fonts</h1>
<ul>
  };

  $html .= join "\n", map {
    my $v = $Fonts->{$_};
    my $r;
    if ($v->{type} eq 'opentype') {
      $r = sprintf q{
        <li><a href="opentype/%s">%s</a>
        (}, $v->{path}, $_,
      ;
      if (defined $v->{italic_path}) {
        $r .= sprintf q{<a href="opentype/%s">Italic</a>, },
            $v->{italic_path};
      }
      $r .= sprintf q{<a href="%s">license</a>, 
         <a href="%s">SuikaWiki</a>,
         <a href="https://raw.githubusercontent.com/suikawiki/fonts/refs/heads/master/packref/%s">packref</a>)
      }, $v->{license_url} // ('opentype/' . $v->{license_path}),
          $v->{sw_url}, $v->{packref_path};
    } elsif ($v->{type} eq 'bitmap') {
      $r = sprintf q{
        <li><a href="bdf/%s">%s</a>
        (<a href="bdf/%s">BDF</a>, 
         <a href="bdf/%s">license</a>, 
         <a href="%s">SuikaWiki</a>,
         <a href="https://raw.githubusercontent.com/suikawiki/fonts/refs/heads/master/packref/%s">packref</a>)
      }, $v->{dat_path}, $_, $v->{bdf_path}, $v->{license_path}, $v->{sw_url},
          $v->{packref_path};
    } elsif ($v->{type} eq 'imageset') {
      $r = sprintf q{
        <li><a href="imageset/%s">%s</a>
        (<a href="%s">license</a>, <a href="%s">SuikaWiki</a>)
      }, $v->{index_path}, $_,
          $v->{license_url} // ('imageset/' . $v->{license_path}),
          $v->{sw_url};
    } elsif ($v->{type} eq 'images') {
      $r = sprintf q{
        <li><a href="images/%s">%s</a>
        (<a href="%s">license</a>, <a href="%s">SuikaWiki</a>)
      }, $v->{index_path}, $_, $v->{license_url}, $v->{sw_url};
    } elsif ($v->{type} eq 'kage') {
      $r = sprintf q{
        <li><a href="%s">%s</a>
        (<a href="%s">license</a>, <a href="%s">SuikaWiki</a>,
         <a href="https://raw.githubusercontent.com/suikawiki/fonts/refs/heads/master/packref/%s">packref</a>)
      }, $v->{dump_path} // $v->{patch_json_path}, $_, $v->{license_path},
          $v->{sw_url}, $v->{packref_path};
    } else {
      die $v->{type};
    }
    if (defined $v->{desc}) {
      $r .= sprintf ' <small class=sw-weak>(%s)</small>', $v->{desc};
    }
    $r;
  } sort { $a cmp $b } keys %$Fonts;

  $html .= q{
</ul>

<footer class=footer>
<a href=https://suikawiki.org rel=top>SuikaWiki.org</a>
</footer>

<script src="https://manakai.github.io/js/global.js" async></script>
  };
  $path->spew_utf8 ($html);
}

## License: Public Domain.
