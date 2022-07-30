use strict;
use warnings;
use Path::Tiny;
use lib glob path (__FILE__)->parent->child ('modules/*/lib');
use JSON::PS;
use Web::DOM::Document;

my $RootPath = path (__FILE__)->parent->parent;
my $OutPath = $RootPath->child ('images/glyphs');
$OutPath->mkpath;

my $Data;
{
  my $path = $RootPath->child ('local/glyphs.json');
  $Data = json_bytes2perl $path->slurp;
}

sub bits_to_svg ($) {
  my $bits = shift;

  my $r = q{<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><style>rect{width:1px;height:1px;fill:currentcolor}</style>};

  my $black = qr{\x{25A0}};
  my $white = qr{\x{25A1}};

  my $x = 0;
  my $y = 0;
  for (split /\x0A/, $bits) {
    while (m{([$black$white])}go) {
      my $c = $1;
      if ($c =~ /$black/o) {
        $r .= sprintf q{<rect x="%d" y="%d"/>}, $x, $y;
      }
      $x++;
    }
    if ($x) {
      $x = 0;
      $y++;
    }
  }
  
  $r .= '</svg>';

  return $r;
} # bits_to_svg

my $doc = new Web::DOM::Document;
my $el = $doc->create_element ('p');
for my $data (@$Data) {
  my $id = $data->{id}->[0]->{text} // '';
  next unless $id =~ /\A(?:swc|sandbox)[1-9][0-9]*\z/;

  my $xml = $data->{"64x64"}->[0]->{xml};
  next unless defined $xml;
  eval { $el->inner_html ($xml) };
  my $pre_el = $el->query_selector ('pre');
  if (defined $pre_el) {
    my $bits = $pre_el->text_content;

    my $path = $OutPath->child ("$id.svg");
    $path->spew (bits_to_svg $bits);
  }
  $el->inner_html ('');
}

## License: Public Domain.
