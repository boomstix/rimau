function setupSequences() {
	
	var sequences = $('.sequence')
	,	sequence = null
	,	panels = null
	,	panel = null
	;
	
	console.log(sequences);
	
	sequences.each(function(ix, el) {
	
		console.log(el);
	
		sequence = $(el);
		
		panels = $('.panel', sequence);
		// panels.addClass('enhanced');
		
	});

	
}