use strict;
use warnings;
use Path::Tiny;
use lib glob path (__FILE__)->parent->parent->child ('bin/modules/*/lib');
use JSON::PS;

my $ThisPath = path (__FILE__)->parent;
my $Data = {};

{
  my $path = $ThisPath->child ('glyphs.txt');
  my $gname;
  my $redefine;
  for (split /\x0A/, $path->slurp) {
    if (/^\s*#/) {
      #
    } elsif (/^(g[1-9][0-9]*)\s*$/) {
      $gname = $1;
      undef $redefine;
    } elsif (/^  ([a-z0-9_-]+)\s*$/) {
      die "Duplicate base |$1|"
          if defined $Data->{glyphs}->{$gname // die}->{base};
      $Data->{glyphs}->{$gname}->{base} = $1;
      undef $redefine;
    } elsif (/^  ([a-z0-9_-]+)\s*:=\s*([a-z0-9_-]+)\s*$/) {
      die "Duplicate := |$1|"
          if $Data->{glyphs}->{$gname // die}->{replace}->{$1};
      $Data->{glyphs}->{$gname}->{replace}->{$1} = $2;
      undef $redefine;
    } elsif (/^  ([a-z0-9_-]+)\s*:=\s*$/) {
      die "Duplicate := |$1|"
          if $Data->{glyphs}->{$gname // die}->{redefine}->{$1};
      $redefine = $Data->{glyphs}->{$gname}->{redefine}->{$1} = [];
    } elsif (/^    (\S+)\s*$/) {
      die "Bad definition" unless defined $redefine;
      push @$redefine, $1;
    } elsif (/\S/) {
      die "Bad line |$_|";
    }
  }
}

for my $data (values %{$Data->{glyphs}}) {
  for my $key (keys %{$data->{redefine} or {}}) {
    $data->{redefine}->{$key} = join '$', @{$data->{redefine}->{$key}};
  }
}

print perl2json_bytes_for_record $Data;

## License: Public Domain.
