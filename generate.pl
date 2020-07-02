use strict;
use warnings;

use Data::Dumper;

print '[';
my $fst = 1;
while (<>) {
    my $br = 1;
    s/-+/ --- /g; # correct em-dashes
    tr/'"`/'''/;  # normalise quotation marks
    s/[^a-zA-z0-9-.:;,!?' ]//g; # strip all other characters
    map {
	if ($_ ne '') {

	    $_ = uc;

	    if ($br) {
		$br = 0;
		$_ = '\n'.$_;
	    }

	    $_ = ($fst ? '' : ', ').'"'.$_.'"';
	    $fst = 0;
	    print $_;
	}
    } split / +/;
} print ']';

