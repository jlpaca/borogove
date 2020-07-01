use strict;
use warnings;

use Data::Dumper;

print '[';
my $fst = 1;
while (<>) {
    s/-+/ --- /g; # correct em-dashes
    tr/'"`/'''/;  # normalise quotation marks
    s/[^a-zA-z0-9-.:;,!?' ]//g; # strip all other characters
    map {
	if ($_ ne '') {
	    $_ = uc;
	    if ($fst) {
		$fst = 0;
		print "\"$_\"";
	    } else  {
		print ", \"$_\"";
	    }
	}
    } split /\s+/;
} print ']';

