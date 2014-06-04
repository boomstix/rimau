	function setupQA() {
	
		$('.q-and-a').each(function(ix, el){
		
			sequence = $(el);
			//console.log(el);
			
			qns = $('dt', el);
			ans = $('dd', el);
			
			//qns.css({top: '100%'});
			//ans.css({top: '100%'});
			
			//console.log(qns);
			
			// Create a timeline for the tweens to happen on
			timeline = new TimelineMax({onUpdate: function(){
				// console.log('update',this.time(), this.currentLabel(), this.getChildren())
			}});
	
			sceneCount = qns.length; // the number of transitions
			framesPerScene = 3; // the number of frames in a scene
			frameOverlap = 0; // the number of frames which overlap between scenes
			frameHeight = (bodyDims.h / 2); // the height of a 'scene' in pixels (half a window height)
	
			frameCount = (sceneCount * framesPerScene) + 1;
	
			totalDuration = frameCount *  frameHeight;
			
			// Add a label (timestamp) for each sceneCount x framesPerScene - (sceneCount - 1) * frameOverlap	
			for (var ix = -1; ++ix <= frameCount;) {
				// labels offset from 0 - ie first is scene-0
				timeline.add('scene-' + ix, ix);
			}
	
			for (var sceneNumber = 0; sceneNumber < sceneCount; sceneNumber++) {
				
				currQn = $(qns[sceneNumber]);
				currAn = $(ans[sceneNumber]);
				
				sceneStartFrame = (framesPerScene * sceneNumber);
				// console.log('sceneNumber: %o sceneStartFrame: %o', sceneNumber, sceneStartFrame);
	
				fadeQnStartLabel = 'scene-' + (sceneStartFrame);
				fadeAnStartLabel = 'scene-' + (sceneStartFrame + 1);
				
				timeline
				.add(TweenMax.set(currQn, {autoAlpha: 0}), 'scene-0')
				.add(TweenMax.set(currAn, {autoAlpha: 0}), 'scene-0')
				.add(TweenMax.to(currQn, 1, {
						autoAlpha: 1
// 					,	onStart: function(){console.log('question ' +  arguments[0] + ' fade in start');}
// 					, onStartParams: [sceneNumber]
// 					,	onComplete: function(){console.log('question ' +  arguments[0] + ' fade in complete');}
// 					, onCompleteParams: [sceneNumber]
					}), fadeQnStartLabel)
				.add(TweenMax.to(currAn, 1, {
						autoAlpha: 1
// 					,	onStart: function(){console.log('question ' +  arguments[0] + ' fade in start');}
// 					, onStartParams: [sceneNumber]
// 					,	onComplete: function(){console.log('question ' +  arguments[0] + ' fade in complete');}
// 					, onCompleteParams: [sceneNumber]
					}), fadeAnStartLabel)
					;
			}
			
			// timeline.add(TweenMax.to(sequence, 1, {autoAlpha: 0}));

			// Create a scroll scene
			scene = new ScrollScene({ duration: totalDuration, offset: frameHeight })
			.triggerElement(sequence)
			.triggerHook('onCenter')
			.setPin(sequence)
			.setTween(timeline)
			.addTo(controller)
			.addIndicators({suffix: 'scene'})
			;
		
		});
		
	}
	