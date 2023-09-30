use strict;
use warnings;
use Path::Tiny;

sub generate ($$$$) {
  my ($in_path, $out_path, $enctype, $size) = @_;

  my $data = [];

  my $index;
  my $in_data = 0;
  my $hw = $size =~ s{/2$}{};
  my $length = $size / 8 * 2;
  $length /= 2 if $hw;
  my $width = $size;
  my $height = $size;
  $width /= 2 if $hw;
  my $min_dy = 0;
  if ($size == 16) {
    $min_dy = -2;
  } elsif ($size == 24) {
    if ($in_path =~ m{/i[^/]+$}) {
      $min_dy = -5;
    } else {
      $min_dy = -4;
    }
  }
  my @value;
  my $dx;
  my $dy;
  my $name;
  for (split /\n/, $in_path->slurp) {
    if ($in_data and /^([0-9A-Fa-f]+)$/) {
      my $v = '';
      $v .= pack 'C', hex $1 while s/^([0-9A-Fa-f]{2})//;
      push @value, $v;
    } elsif (/^ENCODING\s+(\d+)$/) {
      my $n = $1;
      if ($enctype eq '9494') {
        my $k = int ($n / 0x100) - 0x20;
        my $t = ($n % 0x100) - 0x20;
        $index = ($k - 1) * 94 + ($t - 1);
      } elsif ($enctype eq 'dbcs') {
        $index = $n - 0x8140;
      } elsif ($enctype eq 'raw') {
        $index = 0+$n;
      } else {
        die "Bad encoding type |$enctype|";
      }
    } elsif (/^BITMAP$/) {
      $in_data = 1;
      @value = ();
    } elsif (/^BBX 16 16 0 -2$/) {
      undef $dx;
      undef $dy;
    } elsif (/^BBX ([0-9]+) ([0-9]+) (-?[0-9]+) (-?[0-9]+)$/) {
      $dx = 0+$3;
      $dy = 0+$4;
    } elsif (/^BBX/) {
      die $_;
    } elsif ($in_data and /^ENDCHAR$/) {
      if (defined $dx) {
        @value = map { join '', map { reverse sprintf '%08b', ord $_ } split //, $_ } @value;
        if ($dx > 0) {
          my $prefix = '0' x $dx;
          for (@value) {
            $_ = $prefix . $_;
          }
        } elsif ($dx < 0) {
          #die $dx;
        }
        @value = ('') unless @value;
        my $wp = int ($width / 8) * 8;
        $wp += 8 if $wp < $width;
        for (@value) {
          $_ .= '0' while length $_ < $wp;
          $_ = substr $_, 0, $wp;
        }
        my $h = $dy - $min_dy;
        if ($h) {
          die "$name $dx $dy $index" if not @value;
          my $v = '0' x (length $value[0]);
          push @value, $v for 1..$h;
        }
        while (@value < $height) {
          my $v = '0' x (length $value[0]);
          unshift @value, $v;
        }
        pop @value while @value > $height;
        #$data->[$index] = "(" . $dx . ") " . $dy . "(h)\n" .
        #    join "\x0A", @value;
        for (@value) {
          $_ = pack 'B' . $width, $_;
        }
        ## Some 9494 bdf font has ENCODING 32
        $data->[$index] = join '', @value if $index >= 0;
      } else {
        $data->[$index] = join '', @value if $index >= 0;
      }
    } elsif (/^STARTCHAR (.+)/) {
      $name = $1;
    }
  }

  my $w = $size;
  my $h = $size;
  $w /= 2 if $hw;
  my $wp = int ($w / 8) * 8;
  $wp += 8 if $wp < $w;
  my $blength = $h * $wp / 8;
  my $out_file = $out_path->openw;
  for (0..$#$data) {
    my $v = $data->[$_] // '';
    $v .= "\x00" while (length $v) < $blength;
    print $out_file $v;
  }
} # generate

my $in_path = path (shift);
my $out_path = path (shift);
my $enctype = shift;
my $size = shift;
generate ($in_path, $out_path, $enctype, $size);

## License: Public Domain.
