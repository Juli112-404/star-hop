(function(root){
class StarCheckpoint{
 constructor(enabled){this.enabled=!!enabled;this.snapshot=null;this.shots=-1;this.credited=false}
 capture(game,credited){if(!this.enabled||game.state!=='playing'||game.flight||game.inTransit||game.used===0||game.used===this.shots)return false;this.snapshot=game.clone();this.shots=game.used;this.credited=!!credited;return true}
 restore(failed){if(!this.snapshot)return null;const g=this.snapshot.clone();g.state='playing';delete g.reason;g.failurePoint=null;g.messageTime=0;g.trail=[];g.waitOnPlanet=0;g.launchRemaining=g.level.nodes[g.current].launchSeconds??null;g.ball=g.orbitPoint();g.inTransit=false;for(const i of failed?.collected||[])g.collected.add(i);if(g.twin){g.twin.state='playing';delete g.twin.reason;g.twin.failurePoint=null;g.twin.trail=[];g.twin.waitOnPlanet=0;g.twin.launchRemaining=g.launchRemaining;g.twin.time=g.time;g.twin.angle=g.angle+g.twinGap();g.twin.ball=g.twin.orbitPoint();g.twin.collected=new Set(g.collected)}return{game:g,credited:this.credited||g.collected.size>0}}
}
if(typeof module!=='undefined'&&module.exports)module.exports=StarCheckpoint;else root.StarCheckpoint=StarCheckpoint;
})(globalThis);
