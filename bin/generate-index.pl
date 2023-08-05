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
      sprintf q{
        @font-face {
          font-family: '%s';
          src: url(../%s);
        }
      }, $_, $v->{path};
    } elsif ($v->{type} eq 'images' or $v->{type} eq 'bitmap') {
      '';
    } else {
      die $v->{type};
    }
  } sort { $a cmp $b } keys %$Fonts;
  $css .= q{/* License: Public Domain. */};
  $path->spew ($css);
}

{
  my $path = $RootPath->child ('index.html');
  $path->parent->mkpath;

  my $html = q{
<!DOCTYPE HTML>
<html lang=en>
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
    if ($v->{type} eq 'opentype') {
      sprintf q{
        <li><a href="local/opentype/%s">%s</a>
        (<a href="local/opentype/%s">license</a>, 
         <a href="%s">SuikaWiki</a>)
      }, $v->{path}, $_, $v->{license_path}, $v->{sw_url};
    } elsif ($v->{type} eq 'bitmap') {
      sprintf q{
        <li><a href="local/%s">%s</a>
        (<a href="local/%s">BDF</a>, 
         <a href="local/%s">license</a>, 
         <a href="%s">SuikaWiki</a>)
      }, $v->{dat_path}, $_, $v->{bdf_path}, $v->{license_path}, $v->{sw_url};
    } elsif ($v->{type} eq 'images') {
      sprintf q{
        <li><a href="images/%s">%s</a>
        (<a href="%s">SuikaWiki</a>)
      }, $v->{index_path}, $_, $v->{sw_url};
    } else {
      die $v->{type};
    }
  } sort { $a cmp $b } keys %$Fonts;

  $html .= q{
</ul>

<footer class=footer>
<a href=https://suikawiki.org rel=top>SuikaWiki.org</a>
</footer>

<script src="https://manakai.github.io/js/global.js" async></script>
  };
  $path->spew ($html);
}

## License: Public Domain.
