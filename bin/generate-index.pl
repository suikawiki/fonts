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
        sprintf q{
          @font-face {
            font-family: '%s';
            src: url(../%s);
            %s
          }
        },
            $v->{font_family} // $_, $v->{path},
            ($v->{unicode_range} ? 'unicode-range: ' . $v->{unicode_range} . ';' : ''),
        ;
      } else {
        '';
      }
    } elsif ($v->{type} eq 'images' or $v->{type} eq 'bitmap' or
             $v->{type} eq 'imageset') {
      '';
    } else {
      die $v->{type};
    }
  } sort { $a cmp $b } keys %$Fonts;
  $css .= q{/* License: Public Domain. */};
  $path->spew_utf8 ($css);
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
        (<a href="opentype/%s">license</a>, 
         <a href="%s">SuikaWiki</a>)
      }, $v->{path}, $_, $v->{license_path}, $v->{sw_url};
    } elsif ($v->{type} eq 'bitmap') {
      $r = sprintf q{
        <li><a href="bdf/%s">%s</a>
        (<a href="bdf/%s">BDF</a>, 
         <a href="bdf/%s">license</a>, 
         <a href="%s">SuikaWiki</a>)
      }, $v->{dat_path}, $_, $v->{bdf_path}, $v->{license_path}, $v->{sw_url};
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
