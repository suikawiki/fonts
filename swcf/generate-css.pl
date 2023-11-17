use strict;
use warnings;
use Path::Tiny;
use JSON::PS;

my $ThisPath = path (__FILE__)->parent;
my $RootPath = $ThisPath->parent;

my $Data;
{
  my $path = $RootPath->child ('local/swcf/swcf-hanmin-mapping.json');
  $Data = json_bytes2perl $path->slurp;
}

my @all;
for my $name (sort { $a cmp $b } grep {
  not {
    pq => 1,
    pr => 1,
    prs => 1,
    ps => 1,
    rs => 1,
    z => 1,
  }->{$_};
} keys %{$Data->{_categories}}) {
  if (1 == length $name) {
    my $range = $Data->{ranges}->{$name};
    $range .= "," . $Data->{ranges}->{rs} if $name eq "s";
    $range .= "," . $Data->{ranges}->{z} if $name eq "s";
    $range = join ',', map { 'U+' . $_} split /,/, $range;
    printf q{@font-face {
  font-family: 'SuikaWiki Composed Han %s';
  src: url(hanmin/%s.ttf);
  unicode-range: %s;
  font-display: fallback;
}
}, $name, $name, $range;
    push @all, $name;
  } else {
    push @all, $name;
  }
}

printf q{:root {
  --suikawiki-composed-font-family: %s;
}
}, join ', ', map { "'SuikaWiki Composed Han $_'" } @all;

print q{/* License: Public Domain. */};

## License: Public Domain.

