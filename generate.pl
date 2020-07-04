use strict;
use warnings;

$/ = "\n\n"; # collapse single newlines
my $fst = 1;
while (<>) {
    my $br = 1;
    s/-+-+/ --- /g; # normalise em-dashes
    tr/'"`/'''/;    # normalise quotation marks
    s/[^a-zA-z0-9-.:;,!?' \n]//g; # strip all other characters

    map {
	if ($_ ne '') {

	    $_ = uc;
	    print ($fst ? '["' : ', "');
	    print ($br  ? '\n' : ' ');
	    print $_;
	    print '"';

	    $fst = 0;
	    $br = 0;
	}
    } split /\s+/;
}
print "]";
