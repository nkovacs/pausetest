var p = require('pauseable');

$(function() {

	var foo;

	$('.start').click(function(e) {
		e.preventDefault();
		foo = p.setTimeout(function() {
			$('.done').text('Done!');
			foo = null;
		}, 100 * 1000);
	});

	$('.pause').click(function(e) {
		e.preventDefault();
		if (!foo) {
			return;
		}
		if (!foo.isPaused()) {
			foo.pause();
		} else {
			foo.resume();
		}
	});

	setInterval(function() {
		if (!foo) {
			return;
		}
		$('.timer').text(foo.next());
	}, 100);

});
