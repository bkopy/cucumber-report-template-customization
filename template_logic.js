(function() {
	'use strict';

	// Thanks to http://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript/30810322#30810322
	function copyTextToClipboard(text) {
		// Puts the supplied text into a hidden text area to select it and copy it the clipboard
		var textArea = document.createElement("textarea");
		textArea.class = 'copy-to-clipboard';
		textArea.value = text;
		document.body.appendChild(textArea);
		textArea.select();
		try {
			document.execCommand('copy');
		} finally {
			document.body.removeChild(textArea);
		}
	}

	var failed = document.getElementsByClassName('failed');
	for (var i = 0; i < failed.length; i += 1) {
		if (failed[i].className === 'failed') {
			failed[i].addEventListener('click', (function(i) {
				return function() {
					if (failed[i].nextElementSibling.classList.contains('hidden')) {
						failed[i].nextElementSibling.classList.remove('hidden');
					} else {
						failed[i].nextElementSibling.classList.add('hidden');
					}
					copyTextToClipboard(failed[i].nextElementSibling.textContent);
				}
			})(i));
		}
		else if (failed[i].classList.contains('hidden')) {
			console.log('elif here');
			failed[i].addEventListener('click', (function(i) {
				return function() {
					console.log('im here now');
					if (failed[i].classList.contains('hidden')) {
						failed[i].classList.remove('hidden');
					} else {
						failed[i].classList.add('hidden');
					}
				}
			})(i));
		}
	}
})(window);