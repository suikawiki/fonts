use strict;
use warnings;
use Path::Tiny;
use lib glob path (__FILE__)->parent->parent->child ('bin/modules/*/lib');
use JSON::PS;
use Web::Encoding;

my $Data;
{
  local $/ = undef;
  $Data = json_bytes2perl <>;
}

print q{<!DOCTYPE HTML>
<html lang=en>
<meta charset=utf-8>
<title>References</title>
<link rel=license href="https://suika.suikawiki.org/c/pd" title="Public Domain.">
<link rel=stylesheet href=https://fonts.suikawiki.org/frq/frq.css>
<link rel=stylesheet href="https://wiki.suikawiki.org/styles/sw">
<link rel=stylesheet href=generated/fonts.css>
<link rel=icon href="https://wiki.suikawiki.org/favicon.ico">
<meta name="viewport" content="width=device-width,initial-scale=1">
<script src="https://data.suikawiki.org/js/components.js" async></script>
<script src=https://fonts.suikawiki.org/swcf/kana/swcfk.js async></script>
<h1>References</h1>

<dl>
};

sub htescape ($) {
  my $s = $_[0];
  $s =~ s/&/&amp;/g;
  $s =~ s/</&lt;/g;
  $s =~ s/>/&gt;/g;
  $s =~ s/"/&quot;/g;
  return $s;
} # htescape

for my $ref (sort { $a cmp $b } keys %{$Data}) {
  printf q{
    <div>
      <dt>
  };
  if ($ref =~ /^(swc[0-9]+)(?:\(([^()]*)\)|)$/) {
    print encode_web_utf8 sprintf q{
      <a class="sw-anchor sw-sw-ch-anchor" href="https://data.suikawiki.org/char/char::%s"><code value="" class=" sw-sw-ch"><img alt="%s" src="https://fonts.suikawiki.org/images/glyphs/%s.svg" class="sw-char-glyph"></code></a>
      <can-copy><a href="https://wiki.suikawiki.org/n/%s"><code>%s</code></a></can-copy>
    }, $1, $2 // '', $1, $1, $1;
  } elsif ($ref =~ /^swk:([^.]+)\.(.+)$/) {
    my $char = $1;
    my $features = $2;
    $char =~ s/u([0-9a-f]+)/chr hex $1/ge;
    my $ch = ':u-swk-' . join '-',
        (map { sprintf '%04x', ord $_ } split //, $char),
        (split /\./, $features);
    print encode_web_utf8 sprintf q{
      <a class="sw-anchor sw-sw-ch-anchor" href="https://data.suikawiki.org/char/char:%s"><code value="" class=" sw-sw-ch"><swcf-k features="%s">%s</swcf-k></code></a>
      <can-copy><code>%s</code></can-copy>
    },
        (htescape $ch),
        ($features), (htescape $char),
        (htescape $ch);
  }
  print encode_web_utf8 sprintf q{
        <can-copy><code>__&amp;&amp;%s&amp;&amp;__</code></can-copy>
      <dd>
  }, htescape $ref;
  for my $pid (sort { $a <=> $b } keys %{$Data->{$ref}}) {
    printf q{
      <a href="https://wiki.suikawiki.org/i/%d" class=sw-anchor><code>%d</code> (<data>%d</data>)</a>
    }, $pid, $pid, $Data->{$ref}->{$pid};
  }
  print encode_web_utf8 sprintf q{
    </div>
  };
}

print q{
</dl>

<footer class=footer>
<a href=https://fonts.suikawiki.org rel=top>Fonts.SuikaWiki.org</a>
</footer>

<script src="https://manakai.github.io/js/global.js" async></script>
};


## License: Public Domain.
