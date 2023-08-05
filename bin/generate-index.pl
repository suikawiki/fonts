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
    die unless $v->{type} eq 'opentype';
    sprintf q{
      @font-face {
        font-family: '%s';
        src: url(../%s);
      }
    }, $_, $v->{path};
  } sort { $a cmp $b } keys %$Fonts;
  $css .= q{/* License: Public Domain. */};
  $path->spew ($css);
}

## License: Public Domain.
