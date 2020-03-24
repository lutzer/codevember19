function setCaption(text, dimensions) {
    var ele = document.getElementById('caption')
    // ele.style.marginTop = dimensions[1]/2 + "px"
    // ele.style.width = dimensions[0] + "px"
    ele.innerHTML = text
}

function setTitle(text, dimensions) {
    var ele = document.getElementById('title')
    // ele.style.marginTop = -dimensions[1]/2 + "px"
    ele.innerHTML = text
}

function getPixels(img, width, height) {
    const imgCanvas = document.createElement('canvas')
    imgCanvas.width = width
    imgCanvas.height = height
    const imgContext = imgCanvas.getContext('2d');
    imgContext.drawImage(img, 0, 0, width, height);
    const pixels = imgContext.getImageData(0, 0, width, height);
    return pixels
}

function setCanvasPadding(padding) {
    const canvas = document.getElementsByTagName('canvas')[0]
    canvas.style.padding = padding
}

async function wait(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

export { setCaption, setTitle, getPixels, wait, setCanvasPadding }