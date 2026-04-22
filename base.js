var hypes = document.getElementsByClassName("hype");
var deg = 360;
var i = Math.floor(Math.random() * deg);
function go() {
	for (let hype of hypes) {
		hype.style.color = "hsl(" + String(i) + ",100%,50%)";
	}
	i = (i + 1) % deg;
	requestAnimationFrame(go);
}
go();