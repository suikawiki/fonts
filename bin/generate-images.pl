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
my $items = [];
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

    push @$items, {id => $id, url => "$id.svg"};
  }
  $el->inner_html ('');
}

{
  my $path = $OutPath->child ('index.html');
  $path->parent->mkpath;

  my $html = q{
<!DOCTYPE HTML>
<html lang=en>
<title>Glyphs</title>
<link rel=license href="https://wiki.suikawiki.org/n/WikiPageLicense">
<link rel=stylesheet href="https://wiki.suikawiki.org/styles/sw">
<link rel=icon href="https://wiki.suikawiki.org/favicon.ico">
<meta name="viewport" content="width=device-width,initial-scale=1">
<h1>Glyphs</h1>
<style>
  figure {
    display: inline-block;
    margin: 1em;
    padding: 1em;
    text-align: center;
  }
  img {
    width: 5em;
    height: 5em;
    vertical-align: middle;
  }
</style>
  };

  for my $item (@$items) {
    $html .= sprintf q{
      <figure>
        <img src="%s">
        <figcaption>
          <a href="https://wiki.suikawiki.org/n/%s"><code>%s</code></a>
        </figcaption>
      </figure>
    }, $item->{url}, $item->{id}, $item->{id};
  }

  $html .= q{

<footer class=footer>
<a href=https://suikawiki.org rel=top>SuikaWiki.org</a>
</footer>

<script src="https://manakai.github.io/js/global.js" async></script>
  };
  $path->spew ($html);
}

## License: Public Domain.
