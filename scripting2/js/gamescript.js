let ctx, canvasWidth, canvasHeight
const score = 0
canvasWidth = 1200
canvasHeight = 600

const levels = [
	{ name: "mercury", width: 108, height: 104 },
	{ name: "venus", width: 108, height: 104 },
	{ name: "earth", width: 108, height: 104 },
	{ name: "mars", width: 108, height: 104 },
	{ name: "jupiter", width: 104, height: 108 },
	{ name: "saturn", width: 116, height: 112 },
	{ name: "uranus", width: 132, height: 108 },
	{ name: "neptune", width: 108, height: 104 },
	{ name: "sun", width: 112, height: 116 },
]

let currentLevel = 0
const numberOfStars = 5
let stars = []
let player, planet
let gameState = "start"
let canvas
let countdownTimer = 3
let isCountingDown = false
let isPaused = false

function start() {
	function gameloop() {
		update()
		draw()
		requestAnimationFrame(gameloop)
	}
	gameloop()
}

function generateStarCoordinates(numberOfStars) {
	const minX = 300
	const maxX = 800
	const minY = 100
	const maxY = 500
	const minDistance = 100

	let coordinates = []
	let attempts = 0
	const maxAttempts = 100

	while (coordinates.length < numberOfStars && attempts < maxAttempts) {
		const x = Math.random() * (maxX - minX) + minX
		const y = Math.random() * (maxY - minY) + minY

		// Check of deze positie ver genoeg van andere sterren is
		let isTooClose = false
		for (const coord of coordinates) {
			const distance = Math.abs(coord.y - y)
			if (distance < minDistance) {
				isTooClose = true
				break
			}
		}

		if (!isTooClose) {
			coordinates.push({ x, y })
		}

		attempts++
	}

	// Sorteer op x-coördinaat voor een betere spreiding
	return coordinates.sort((a, b) => a.x - b.x)
}

function init() {
	canvas = document.getElementById("myCanvas")
	if (!canvas) {
		console.error("Canvas element niet gevonden!")
		return
	}

	resizeCanvas()
	ctx = canvas.getContext("2d")

	if (!ctx) {
		console.error("Canvas context kon niet worden opgehaald!")
		return
	}

	ctx.font = "16px pixel"

	resetGame()
	start()

	document.addEventListener("keydown", handleKeyDown)
	document.addEventListener("keyup", handleKeyUp)
	canvas.addEventListener("click", handleCanvasClick)
	canvas.addEventListener("touchstart", handleTouch)
	canvas.addEventListener("touchend", handleTouchEnd)
	window.addEventListener("resize", resizeCanvas)
	screen.orientation.addEventListener("change", handleOrientationChange)

	// Voeg fullscreen toggle knop toe
	const fullscreenButton = document.createElement("button")
	fullscreenButton.textContent = "Fullscreen"
	fullscreenButton.className = "fullscreen-button"
	fullscreenButton.style.position = "absolute"
	fullscreenButton.style.top = "10px"
	fullscreenButton.style.right = "10px"
	fullscreenButton.addEventListener("click", toggleFullscreen)
	document.body.appendChild(fullscreenButton)

	// Voeg pauze instructie toe
	const pauseInstruction = document.createElement("div")
	pauseInstruction.className = "pause-instruction"
	pauseInstruction.textContent = "Press ESC to pause"
	document.body.appendChild(pauseInstruction)

	// Voeg event listeners toe voor mobiele besturingselementen
	const upButton = document.getElementById("upButton")
	const downButton = document.getElementById("downButton")
	const boostButton = document.getElementById("boostButton")
	const pauseButton = document.getElementById("pauseButton")

	upButton.addEventListener("touchstart", (e) => {
		e.preventDefault()
		player.speedY = -5
	})
	upButton.addEventListener("touchend", (e) => {
		e.preventDefault()
		player.speedY = 0
	})

	downButton.addEventListener("touchstart", (e) => {
		e.preventDefault()
		player.speedY = 5
	})
	downButton.addEventListener("touchend", (e) => {
		e.preventDefault()
		player.speedY = 0
	})

	boostButton.addEventListener("touchstart", (e) => {
		e.preventDefault()
		player.startBoost(Date.now())
		boostButton.classList.add("active")
	})
	boostButton.addEventListener("touchend", (e) => {
		e.preventDefault()
		player.stopBoost()
		boostButton.classList.remove("active")
	})

	pauseButton.addEventListener("touchstart", (e) => {
		e.preventDefault()
		isPaused = !isPaused
	})

	// Voeg mobile class toe voor mobiele styling
	if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
		pauseButton.classList.add('mobile')
	}

	handleOrientationChange()
}

function resetGame() {
	currentLevel = 0
	player = new Player(10, canvasHeight / 2)
	resetLevel()
}

function resetLevel() {
	const levelData = levels[currentLevel]
	planet = new Planet(
		canvasWidth - 200,
		canvasHeight / 2 - levelData.height / 2,
		levelData.width,
		levelData.height,
		levelData.name,
	)

	const coordinates = generateStarCoordinates(numberOfStars + currentLevel)
	stars = coordinates.map((coord) => new Star(coord.x, coord.y, currentLevel))

	// Reset player position
	player.X = 10
	player.Y = canvasHeight / 2
}

function startGame() {
	if (gameState === "start" || gameState === "gameOver" || gameState === "win") {
		resetGame()
		// Start countdown
		countdownTimer = 3
		isCountingDown = true
		gameState = "countdown"
		setTimeout(startCountdown, 1000)
	}
}

function startCountdown() {
	if (countdownTimer > 0) {
		countdownTimer--
		setTimeout(startCountdown, 1000)
	} else {
		isCountingDown = false
		gameState = "playing"
	}
}

function update() {
	const currentTime = Date.now()
	if (gameState === "playing" && !isPaused) {
		player.update(currentTime)

		for (const star of stars) {
			star.update()
			if (player.checkCollision(star)) {
				player.lives--
				player.X = 10
				if (player.lives <= 0) {
					gameState = "gameOver"
				}
			}
		}

		if (player.checkCollision(planet)) {
			currentLevel++
			if (currentLevel >= levels.length) {
				gameState = "win"
			} else {
				resetLevel()
			}
		} else if (player.X + player.width > canvasWidth) {
			player.lives--
			player.X = 10
			if (player.lives <= 0) {
				gameState = "gameOver"
			}
		}
	}
}

function draw() {
	if (!ctx) {
		console.error("Canvas context is niet beschikbaar!")
		return
	}

	ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
	ctx.fillRect(0, 0, canvasWidth, canvasHeight)

	if (gameState === "start") {
		drawStartScreen()
	} else if (gameState === "countdown") {
		drawGame()
		drawCountdown()
	} else if (gameState === "playing") {
		drawGame()
		if (isPaused) {
			drawPauseScreen()
		}
	} else if (gameState === "gameOver") {
		drawGameOverScreen()
	} else if (gameState === "win") {
		drawWinScreen()
	}
}

function drawStartScreen() {
	ctx.fillStyle = "#fff"
	ctx.font = "32px pixel"
	ctx.fillText("Space Adventure", canvasWidth / 2 - 150, canvasHeight / 2 - 100)
	
	ctx.font = "16px pixel"
	// Desktop controls
	if (!window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
		ctx.fillText("Controls:", canvasWidth / 2 - 150, canvasHeight / 2 - 20)
		ctx.fillText("↑ or W : Move Up", canvasWidth / 2 - 150, canvasHeight / 2 + 10)
		ctx.fillText("↓ or S : Move Down", canvasWidth / 2 - 150, canvasHeight / 2 + 40)
		ctx.fillText("SPACE : Boost", canvasWidth / 2 - 150, canvasHeight / 2 + 70)
		ctx.fillText("ESC : Pause", canvasWidth / 2 - 150, canvasHeight / 2 + 100)
	} else {
		// Mobile controls
		ctx.fillText("Controls:", canvasWidth / 2 - 150, canvasHeight / 2 - 20)
		ctx.fillText("↑ : Move Up", canvasWidth / 2 - 150, canvasHeight / 2 + 10)
		ctx.fillText("↓ : Move Down", canvasWidth / 2 - 150, canvasHeight / 2 + 40)
		ctx.fillText("BOOST : Speed Up", canvasWidth / 2 - 150, canvasHeight / 2 + 70)
		ctx.fillText("|| : Pause", canvasWidth / 2 - 150, canvasHeight / 2 + 100)
	}
	
	// Teken een klikbare zone indicator
	ctx.strokeStyle = "#fff"
	ctx.setLineDash([5, 5])  // Maak een gestippelde lijn
	ctx.strokeRect(canvasWidth / 2 - 200, canvasHeight / 2 - 150, 400, 350)
	
	ctx.font = "16px pixel"
	ctx.fillText("Click or tap anywhere in this area to start", canvasWidth / 2 - 150, canvasHeight / 2 + 140)
	
	// Reset de lijn stijl
	ctx.setLineDash([])
}

function drawGame() {
	player.draw(ctx)
	planet.draw(ctx)

	for (const star of stars) {
		star.draw(ctx)
	}

	const pauseInstruction = document.querySelector(".pause-instruction")
	if (pauseInstruction) {
		pauseInstruction.style.opacity = isPaused ? "0" : "1"
	}

	ctx.fillStyle = "#fff"
	ctx.font = "16px pixel"
	ctx.fillText("LIVES: " + player.lives, 20, 30)
	ctx.fillText("LEVEL " + (currentLevel + 1) + ": " + levels[currentLevel].name, canvasWidth - 300, 30)

	// Teken de boost meter
	ctx.fillStyle = "#0f0"
	ctx.fillRect(20, 50, (player.currentBoost / player.maxBoost) * 200, 20)
	ctx.strokeStyle = "#fff"
	ctx.strokeRect(20, 50, 200, 20)
}

function drawGameOverScreen() {
	ctx.fillStyle = "#fff"
	ctx.font = "32px pixel"
	ctx.fillText("GAME OVER", canvasWidth / 2 - 100, canvasHeight / 2 - 50)
	ctx.font = "16px pixel"
	ctx.fillText("Click or tap to restart", canvasWidth / 2 - 90, canvasHeight / 2 + 50)
}

function drawWinScreen() {
	ctx.fillStyle = "#fff"
	ctx.font = "24px pixel"
	ctx.fillText("Congratulations, you've reached", canvasWidth / 2 - 180, canvasHeight / 2 - 50)
	ctx.fillText("the end of the solar system!", canvasWidth / 2 - 160, canvasHeight / 2)
	ctx.font = "16px pixel"
	ctx.fillText("Click or tap to play again", canvasWidth / 2 - 100, canvasHeight / 2 + 100)
}

function drawCountdown() {
	ctx.fillStyle = "#fff"
	ctx.font = "32px pixel"
	ctx.fillText(countdownTimer.toString(), canvasWidth / 2 - 10, canvasHeight / 2)
}

function drawPauseScreen() {
	ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
	ctx.fillRect(0, 0, canvasWidth, canvasHeight)
	
	ctx.fillStyle = "#fff"
	ctx.font = "32px pixel"
	ctx.fillText("PAUSED", canvasWidth / 2 - 60, canvasHeight / 2 - 20)
	ctx.font = "16px pixel"
	ctx.fillText("Press ESC to continue", canvasWidth / 2 - 80, canvasHeight / 2 + 20)
}

function handleKeyDown(e) {
	if (gameState === "start" || gameState === "gameOver" || gameState === "win") {
		if (e.code === "Space") {
			startGame()
		}
	} else if (gameState === "playing") {
		if (e.code === "Escape") {
			isPaused = !isPaused
		} else if (!isPaused) {
			if (e.code === "ArrowUp" || e.code === "KeyW") {
				player.speedY = -5
			} else if (e.code === "ArrowDown" || e.code === "KeyS") {
				player.speedY = 5
			} else if (e.code === "Space") {
				player.startBoost(Date.now())
			}
		}
	}
}

function handleKeyUp(e) {
	if (gameState === "playing") {
		if ((e.code === "ArrowUp" || e.code === "KeyW") && player.speedY < 0) {
			player.speedY = 0
		} else if ((e.code === "ArrowDown" || e.code === "KeyS") && player.speedY > 0) {
			player.speedY = 0
		} else if (e.code === "Space") {
			player.stopBoost()
		}
	}
}

function handleCanvasClick() {
	if (gameState !== "playing") {
		startGame()
	}
}

function handleTouch(e) {
	e.preventDefault()
	if (gameState !== "playing") {
		startGame()
	} else {
		const touch = e.touches[0]
		const rect = e.target.getBoundingClientRect()
		const relativeY = touch.clientY - rect.top
		player.speedY = relativeY < canvasHeight / 2 ? -5 : 5
	}
}

function handleTouchEnd() {
	if (gameState === "playing") {
		player.speedY = 0
	}
}

function resizeCanvas() {
	const windowWidth = window.innerWidth
	const windowHeight = window.innerHeight
	const scale = Math.min(windowWidth / canvasWidth, windowHeight / canvasHeight)

	canvas.style.width = `${canvasWidth * scale}px`
	canvas.style.height = `${canvasHeight * scale}px`
	canvas.width = canvasWidth
	canvas.height = canvasHeight
}

function handleOrientationChange() {
	const mobileControls = document.querySelector(".mobile-controls")
	if (window.innerHeight > window.innerWidth) {
		// Portrait mode
		document.body.style.backgroundColor = "black"
		canvas.style.display = "none"
		mobileControls.style.display = "none"
		showRotateMessage()
	} else {
		// Landscape mode
		document.body.style.backgroundColor = ""
		canvas.style.display = "block"
		mobileControls.style.display = "block"
		hideRotateMessage()
	}
}

function showRotateMessage() {
	let rotateMessage = document.getElementById("rotateMessage")
	if (!rotateMessage) {
		rotateMessage = document.createElement("div")
		rotateMessage.id = "rotateMessage"
		rotateMessage.style.position = "fixed"
		rotateMessage.style.top = "0"
		rotateMessage.style.left = "0"
		rotateMessage.style.width = "100%"
		rotateMessage.style.height = "100%"
		rotateMessage.style.display = "flex"
		rotateMessage.style.justifyContent = "center"
		rotateMessage.style.alignItems = "center"
		rotateMessage.style.backgroundColor = "black"
		rotateMessage.style.color = "white"
		rotateMessage.style.fontSize = "24px"
		rotateMessage.textContent = "Please rotate your device to landscape mode to play the game."
		document.body.appendChild(rotateMessage)
	}
	rotateMessage.style.display = "flex"
}

function hideRotateMessage() {
	const rotateMessage = document.getElementById("rotateMessage")
	if (rotateMessage) {
		rotateMessage.style.display = "none"
	}
}

function toggleFullscreen() {
	if (!document.fullscreenElement) {
		if (document.documentElement.requestFullscreen) {
			document.documentElement.requestFullscreen()
		} else if (document.documentElement.mozRequestFullScreen) {
			// Firefox
			document.documentElement.mozRequestFullScreen()
		} else if (document.documentElement.webkitRequestFullscreen) {
			// Chrome, Safari and Opera
			document.documentElement.webkitRequestFullscreen()
		} else if (document.documentElement.msRequestFullscreen) {
			// IE/Edge
			document.documentElement.msRequestFullscreen()
		}
	} else {
		if (document.exitFullscreen) {
			document.exitFullscreen()
		} else if (document.mozCancelFullScreen) {
			// Firefox
			document.mozCancelFullScreen()
		} else if (document.webkitExitFullscreen) {
			// Chrome, Safari and Opera
			document.webkitExitFullscreen()
		} else if (document.msExitFullscreen) {
			// IE/Edge
			document.msExitFullscreen()
		}
	}
}

