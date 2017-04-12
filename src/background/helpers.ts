export function isExternalURL(url) {

    var domainRe = /https?:\/\/((?:[\w\d]+\.)+[\w\d]{2,})/i

    function domain(url) {

      var index = (url.indexOf("://") > -1) ? 2 : 0
      var domain = url.split('/')[index]

      domain = domain.split(':')[0]

      return domain
   }

    return domain(location.href) !== domain(url)

}

export function toCamelCase(input: string) {
    return input.replace(/-.*/, function(a) { return a.charAt(1).toUpperCase() + a.slice(2) })
}

export function fromCamelCase(input: string) {
    return input.replace(/([A-Z])/g, "-$1").toLowerCase()
}

export function hexToRGBA(hex) {
    return 'rgba(' + (hex = hex.replace('#', '')).match(new RegExp('(.{' + hex.length / 3 + '})', 'g')).map(function(l) { return parseInt(hex.length % 2 ? l + l : l, 16) }).concat(1).join(',') + ')';
}


export function parseMedia(mediaValue){

   let parsedMedia: QueryObj[] = []

   const mediaTexts = mediaValue.split(",")

   mediaTexts.forEach((mediaText, index) => {

      if (mediaText !== "print" && mediaText.substr(0, 1) !== "@") {

          parsedMedia.push({
              width: {
                  min: 0,
                  max: 9000
              },
              height: {
                  min: 0,
                  max: 9000
              }
          })

          mediaText = mediaText.split(" ").join("")

          if (mediaText.indexOf("min-width") > - 1 && (mediaText.indexOf("px") > 0 || mediaText.indexOf("em") > 0)) {
              parsedMedia[index].width.min = (mediaText.indexOf("em") > -1) ? parseInt(mediaText.match(/min-width:(.*?)em/)[1]) * 16 : parseInt(mediaText.match(/min-width:(.*?)px/)[1])
          }

          if (mediaText.indexOf("max-width") > -1 && (mediaText.indexOf("px") > 0 || mediaText.indexOf("em") > 0)) {
              parsedMedia[index].width.max = (mediaText.indexOf("em") > -1) ? parseInt(mediaText.match(/max-width:(.*?)em/)[1]) * 16 : parseInt(mediaText.match(/max-width:(.*?)px/)[1])
          }

          if (mediaText.indexOf("min-height") > -1 && (mediaText.indexOf("px") > 0 || mediaText.indexOf("em") > 0)) {
              parsedMedia[index].height.min = (mediaText.indexOf("em") > -1) ? parseInt(mediaText.match(/min-width:(.*?)em/)[1]) * 16 : parseInt(mediaText.match(/min-height:(.*?)px/)[1])
          }

          if (mediaText.indexOf("max-height") > -1 && (mediaText.indexOf("px") > 0 || mediaText.indexOf("em") > 0)) {
              parsedMedia[index].height.max = (mediaText.indexOf("em") > -1) ? parseInt(mediaText.match(/max-width:(.*?)em/)[1]) * 16 : parseInt(mediaText.match(/max-height:(.*?)px/)[1]);
          }
      }

   })

   return parsedMedia

}

export function textualizeMedia(queries: QueryObj[]){

   let result = ""

   queries.forEach(query => {

      let current = ""

      if (query.width.min > 0) current += `(min-width: ${query.width.min}px)`
      if (query.width.max > 0 && query.width.max < 9000) current  += `${(current.length > 0) ? " and" : ""} (max-width: ${query.width.max}px)`

      if (query.height.min > 0) current += `${(current.length > 0) ? " and" : ""} (min-height: ${query.height.min}px)`
      if (query.height.max > 0 && query.height.max < 9000) current  += `${(current.length > 0) ? " and" : ""} (max-height: ${query.height.max}px)`

      if(current.length > 0) result += `${current}, `

   })

   return result.substr(0, result.length -2)

}

export function getScrollPos(){

   var scrollTop = pageYOffset || (document.documentElement.clientHeight ? document.documentElement.scrollTop : document.body.scrollTop)
   var scrollLeft = pageXOffset || (document.documentElement.clientWidth ? document.documentElement.scrollLeft : document.body.scrollLeft)

   const bodyStyle = window.getComputedStyle(document.body)

   if(bodyStyle.position === "relative" || bodyStyle.position === "absolute"){

      const bodyRect = document.body.getBoundingClientRect()

      const bodyOffsetTop = bodyRect.top + scrollTop
      const bodyOffsetLeft = bodyRect.left + scrollLeft

      if(bodyOffsetTop !== 0 ) scrollTop -= bodyOffsetTop
      if(bodyOffsetLeft !== 0 ) scrollTop -= bodyOffsetLeft

   }

   return {
      top: scrollTop,
      left : scrollLeft
   }

}
