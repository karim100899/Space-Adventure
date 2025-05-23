class GameObject {
	constructor(posX, posY, speedX, speedY, width, height, url) {
		this.X = posX
		this.Y = posY
		this.speedX = speedX
		this.speedY = speedY
		this.width = width
		this.height = height
		this.rotation = 0.0
		this.url = url
		this.image = new Image()
		if (typeof url !== "undefined") {
			this.image.src = url
		} else {
			console.warn("Geen URL opgegeven!")
		}
	}

	update() {
		this.X += this.speedX
		this.Y += this.speedY
	}

	draw(ctx) {
		ctx.save()
		ctx.translate(this.X + this.width / 2, this.Y + this.height / 2)
		ctx.rotate(this.rotation)
		ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height)
		ctx.restore()
	}

	checkCollision(other) {
		return (
			this.X < other.X + other.width &&
			this.X + this.width > other.X &&
			this.Y < other.Y + other.height &&
			this.Y + this.height > other.Y
		)
	}
}

class Player extends GameObject {
	constructor(posX, posY) {
		super(posX, posY, 2, 0, 116, 112, "img/player.png")
		this.lives = 5
		this.maxBoost = 200
		this.currentBoost = this.maxBoost
		this.isBoosting = false
		this.boostSpeed = 4
		this.normalSpeed = 2
		this.lastBoostTime = 0
	}

	update(currentTime) {
		if (this.isBoosting && this.currentBoost > 0) {
			this.speedX = this.boostSpeed
			this.currentBoost--
		} else {
			this.speedX = this.normalSpeed
			this.isBoosting = false
		}

		if (!this.isBoosting && currentTime - this.lastBoostTime > 2000) {
			this.currentBoost = Math.min(this.currentBoost + 2, this.maxBoost)
		}

		super.update()
		this.X = Math.max(0, Math.min(this.X, canvasWidth - this.width))
		this.Y = Math.max(0, Math.min(this.Y, canvasHeight - this.height))
	}

	startBoost(currentTime) {
		if (this.currentBoost > 0) {
			this.isBoosting = true
			this.lastBoostTime = currentTime
		}
	}

	stopBoost() {
		this.isBoosting = false
	}
}

class Star extends GameObject {
	constructor(posX, posY, level = 0) {
		const baseSpeed = level > 5 ? 0.8 : 0;
		const randomSpeed = (Math.random() * 0.4 + baseSpeed);
		const direction = Math.random() > 0.5 ? 1 : -1;
		
		super(posX, posY, 0, randomSpeed * direction, 60, 52, "img/star.png")
		
		this.originalY = posY;
		this.maxDeviation = 50;
		this.level = level;
	}

	update() {
		if (this.level > 5) {
			super.update();
			
			if (Math.abs(this.Y - this.originalY) > this.maxDeviation) {
				this.speedY *= -1;
			}
			
			const minDistance = 80;
			stars.forEach(otherStar => {
				if (otherStar !== this && Math.abs(this.Y - otherStar.Y) < minDistance) {
					this.speedY *= -1;
					otherStar.speedY *= -1;
				}
			});
		}
	}
}

class Planet extends GameObject {
	constructor(posX, posY, width, height, name) {
		super(posX, posY, 0, 0, width, height, `img/${name}.png`)
		this.name = name
	}
}

window.onload = () => {
	const canvas = document.getElementById("myCanvas")
	if (canvas) {
		init()
	} else {
		console.error("Canvas kon niet worden geladen!")
	}
}

