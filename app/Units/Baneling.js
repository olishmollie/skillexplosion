define(['jquery', 'pixi', 'units/UnitConstructor'], function($, PIXI, UC) {

	return function Baneling(options) {
    			
		var options = options || {};
				
		var radius = options.radius || 16;
		var tint = options.tint || 0x00FF00;
		var selectionTint = 0x33FF45;
		var pendingSelectionTint = 0x70ff32;
		var highlightTint = 0xFFFFFF;
		var radius = 20;
		var rc = [{
    			    id: 'marble',
    			    data: currentGame.texture('GlassMarble'),
    			    tint: tint,
    			    scale: {x: radius*2/64, y: radius*2/64},
    			    rotate: 'none',
    			}, {
    			    id: 'marbleBodyHighlight',
    			    data: currentGame.texture('MarbleBodyHighlights'),
    			    scale: {x: radius*2/64, y: radius*2/64},
    			    rotate: 'random',
    			    rotatePredicate: function() {
    			        return this.isMoving;
    			    },
    			    tint: highlightTint,
    			    initialRotate: 'random'
    			}, {
    			    id: 'marbleHighlight',
    			    data: currentGame.texture('MarbleHighlight'),
    			    scale: {x: radius*2/64, y: radius*2/64},
    			    rotate: 'none',
    			    initialRotate: 'none'
    			}, {
    			    id: 'marbleShadow',
    			    data: currentGame.texture('MarbleShadow'),
    			    scale: {x: radius*2.5/256, y: radius*2.5/256},
    			    visible: true,
    			    rotate: 'none',
    			    tint: tint,
    			    stage: "stageZero",
    			    offset: {x: 12, y: 12},
    			}, {
    			    id: 'marbleShadowHighlights',
    			    data: currentGame.texture('MarbleShadowHighlight'),
    			    scale: {x: radius*1.6/256, y: radius*1.6/256},
    			    visible: false,
    			    rotate: 'random',
    			    rotatePredicate: function() {
    			        return this.isMoving;
    			    },
    			    initialRotate: 'random',
    			    tint: highlightTint,
    			    stage: "stageZero",
    			    offset: {x: 12, y: 12}
    			}, {
    			    id: 'selected',
    			    data: currentGame.texture('MarbleSelected'),
    			    scale: {x: (radius+5)*2/64, y: (radius+5)*2/64},
    			    tint: selectionTint,
    			    stage: 'stageOne',
    			    visible: false,
    			    rotate: 'none'
    			}, {
    			    id: 'selectionPending',
    			    data: currentGame.texture('MarbleSelectedPending'),
    			    scale: {x: (radius+8)*2/64, y: (radius+8)*2/64},
    			    stage: 'stageOne',
    			    visible: false,
    			    tint: pendingSelectionTint,
    			    rotate: 'continuous'
    			}];
	
		var baneling = UC({
				renderChildren: rc,
				radius: radius,
				unit: {
					unitType: 'Baneling',
					isoManaged: false,
					health: 10,
					energy: 0,
					team: options.team || 4,
					isSelectable: options.isSelectable
				}, 
				moveable: {
					moveSpeed: 1.5
				},
				attacker: {
					honeRange: 200,
					cooldown: 1,
					range: radius*2+10,
					damage: 18,
					attack: function() {
					
					}
		}});
		
		//create attack blast radius
		var blastRadius = radius*2.5;
		
		baneling.attack = function(target) {
			currentGame.getAnimation('bane', [this.position.x, this.position.y, (blastRadius*2/64), (blastRadius*2/64), Math.random()*40], .5, null, 1).play();
			var nextLevelGo = false;
			
			var bodiesToDamage = [];
			currentGame.applyToBodiesByTeam(function(team) {baneling.team != team}, function(body) {
				currentGame.distanceBetweenBodies(this.body, body) <= blastRadius && body.isAttackable;
			}.bind(this), function(body) {
				body.sufferAttack(baneling.damage);
			});
			this.alreadyAttacked = true;
			if(!this.alreadyDied)
				this.death();
		};
		
		baneling.death = function() {
			var shard = currentGame.addSomethingToRenderer('glassShards', 'background', {position: baneling.position, scale: {x: .65, y: .65}, tint: tint, rotation: Math.random()*6});
				currentGame.addTimer({name: 'shardDisappear' + baneling.id, persists: true, timeLimit: 48, runs: 20, killsSelf: true, callback: function() {
					shard.alpha -= .05;
						}, totallyDoneCallback: function() {
							currentGame.removeSomethingFromRenderer(shard);
			}.bind(this)})
			
			currentGame.pop.play();
			currentGame.removeUnit(this);
			this.alreadyDied = true;
			if(!this.alreadyAttacked)
				this.attack();
		}
		
		return baneling;
	}
})






















