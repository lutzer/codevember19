function setCaption(text, dimensions) {
    var ele = document.getElementById('caption')
    ele.style.marginTop = dimensions[1]/2 + "px"
    ele.style.width = dimensions[0] + "px"
    ele.innerHTML = text
}

function setTitle(text, dimensions) {
    var ele = document.getElementById('title')
    ele.style.marginTop = -dimensions[1]/2 + "px"
    ele.innerHTML = text
}

export { setCaption, setTitle }