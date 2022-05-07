var username = 'whatever'

function httpGet(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

clearInterval(intervalId) // clear the interval from the last paste
var queue = []
var intervalId = setInterval(function(){
	console.log('Queue running with length ' + queue.length)

	if(queue.length > 0){
		var item = queue.pop()
		item()
	}
}, 1000)


var downloadCount = 0
function download(filename, url) {
	queue.push(function(){
		downloadCount++
		console.log('Download Count up to ' + downloadCount, filename)
	
		var xhr = new XMLHttpRequest();
	    xhr.open("GET", url, true);
	    xhr.responseType = "blob";
	    xhr.onload = function(){
	        var urlCreator = window.URL || window.webkitURL;
	        var imageUrl = urlCreator.createObjectURL(this.response);
	        var tag = document.createElement('a');
	        tag.href = imageUrl;
	        tag.download = filename;
	        document.body.appendChild(tag);
	        tag.click();
	        document.body.removeChild(tag);
	    }
	    xhr.send();
	})
}

function downloadContact(v){
	var r = httpGet('https://www.textnow.com/api/users/' + username + '/messages?contact_value=' + v + '&start_message_id=268074788740&direction=past&page_size=9999999&get_archived=1')
	download(v + '.json', 'data:text/plain;charset=utf-8,' + r)

	r = JSON.parse(r)

	r.messages.forEach(function(m){
		var type = m.message_type

		var extension
		if(type == 1){
			// just a plain text message, ignore it
			return
		}
		else if(type === 2){
			extension = '.jpg'
		}
		else if(type === 3){
			extension = '.wav'
		}
		else if(type === 4 || type === 8){
			extension = m.message.split('.').pop()
		}
		else{
			throw 'Unsupported message type of ' + m.message_type + ' on ' + v
		}

		download(m.id + extension, m.message)
	})
}

// download('foo.jpg', 'https://media.textnow.com/?t=whatever&h=whatever.wav')
// downloadContact('+19999999999');
// downloadContact('+8888888888');
// throw 'done!'

var contactValues = {}

var urls = [
	'https://www.textnow.com/api/v3/conversations/recent?page_size=30&updated_at=2019-06-28T09%3A32%3A44Z',
	'https://www.textnow.com/api/v3/conversations/recent?page_size=30&updated_at=2019-06-13T09%3A32%3A44Z',
	'https://www.textnow.com/api/v3/conversations/recent?page_size=30&updated_at=2019-05-28T09%3A32%3A44Z',
	'https://www.textnow.com/api/v3/conversations/recent?page_size=30&updated_at=2019-05-13T09%3A32%3A44Z',
	'https://www.textnow.com/api/v3/conversations/recent?page_size=30&updated_at=2019-04-28T09%3A32%3A44Z',
	'https://www.textnow.com/api/v3/conversations/recent?page_size=30&updated_at=2019-04-13T09%3A32%3A44Z',
	'https://www.textnow.com/api/v3/conversations/recent?page_size=30&updated_at=2019-03-28T09%3A32%3A44Z',
	'https://www.textnow.com/api/v3/conversations/recent?page_size=30&updated_at=2019-03-13T09%3A32%3A44Z',
	'https://www.textnow.com/api/v3/conversations/recent?page_size=30&updated_at=2019-02-28T09%3A32%3A44Z',
	'https://www.textnow.com/api/v3/conversations/recent?page_size=30&updated_at=2019-02-13T09%3A32%3A44Z',
	'https://www.textnow.com/api/v3/conversations/recent?page_size=30&updated_at=2019-01-28T09%3A32%3A44Z',
	'https://www.textnow.com/api/v3/conversations/recent?page_size=30&updated_at=2019-01-13T09%3A32%3A44Z',
	'https://www.textnow.com/api/v3/conversations/recent?page_size=30&updated_at=2018-12-28T09%3A32%3A44Z',
]

urls.forEach(function(url){
	var r = JSON.parse(httpGet(url))
	r.result.forEach(function(r2){
		contactValues[r2.contact_value] = true
	})
})

var contactValues = Object.keys(contactValues)

console.log("Found " + contactValues.length + " conversations")

contactValues.forEach(function(v){
	downloadContact(v)
})