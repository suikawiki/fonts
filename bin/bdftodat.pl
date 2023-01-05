use strict;
use warnings;
use Path::Tiny;

sub generate ($$$) {
  my ($in_path, $out_path, $size) = @_;

  my $data = [];

  my $index;
  my $in_data = 0;
  my $length = $size / 8 * 2;
  my $value = '';
  for (split /\n/, $in_path->slurp) {
    if ($in_data and /^([0-9A-F]{$length})$/) {
      $value .= pack 'C', hex $1 while s/^([0-9A-F]{2})//;
    } elsif (/^ENCODING\s+(\d+)$/) {
      my $n = $1;
      my $k = int ($n / 0x100) - 0x20;
      my $t = ($n % 0x100) - 0x20;
      $index = ($k - 1) * 94 + ($t - 1);
    } elsif (/^BITMAP$/) {
      $in_data = 1;
      $value = '';
    } elsif ($in_data and /^ENDCHAR$/) {
      $data->[$index] = $value;
    }
  }

  my $blength = $size * $size / 8;
  my $out_file = $out_path->openw;
  for (0..$#$data) {
    my $v = $data->[$_] // '';
    $v .= "\x00" while (length $v) < $blength;
    print $out_file $v;
  }
} # generate

my $in_path = path (shift);
my $out_path = path (shift);
my $size = shift;
generate ($in_path, $out_path, $size);

## License: Public Domain.
