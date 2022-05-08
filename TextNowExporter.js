class TextNowExporter{
    constructor(){
        this.filesDownloaded = []
        this.queue = []
        this.queueStarted = false

        this.downloadConversations((new Date()).toISOString())

        setInterval(() => {
            this.processQueueItem()
        }, 500)
    }

    downloadConversations(updatedAt, lastConversation){
        // if((new Date(updatedAt) < new Date('2022'))){
        //     console.log('Date limit reached', updatedAt)
        //     return
        // }

        console.log('Loading recent conversations from', updatedAt)

        const pageSize = 30 // This is the max that the API supports
        fetch('https://www.textnow.com/api/v3/conversations/recent?page_size=' + pageSize + '&updated_at=' + updatedAt)
        .then(response => response.json())
        .then(data => {
            const result = data.result
            
            let lastConversationFound = lastConversation === undefined
            result.forEach((conversation) => {
                if(lastConversationFound){
                    this.downloadConversation(conversation)
                }
                else if(conversation.contact_value === lastConversation.contact_value){
                    lastConversationFound = true
                }
            })

            if(result.length >= pageSize){
                lastConversation = result.at(-1)
                this.downloadConversations(lastConversation.updated_at, lastConversation)
            }
            else{
                console.log('Finished processing conversations')
                console.log('Waiting for files to finish downloading...  Please look for errors.')
            }
        })
    }

    async downloadConversation(conversation){
        const json = await fetch('https://www.textnow.com/api/users/' + conversation.username + '/messages?contact_value=' + conversation.contact_value + '&start_message_id=99999999999999&direction=past&page_size=9999999&get_archived=1')
            .then(response => response.text())
        
        this.queueDownload(conversation.contact_value + '.json', 'data:text/plain;charset=utf-8,' + json)
    
        JSON.parse(json).messages.forEach((m) => {
            const type = m.message_type
    
            let extension
            if(type == 1){
                // This is just a plain text message.  There is nothing else to download.
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
                throw 'Unsupported message type of ' + m.message_type + ' on ' + conversation.contact_value
            }
    
            this.queueDownload(m.id + extension, m.message)
        })
    }
    
    queueDownload(filename, url){
        this.queueStarted = true
        this.filesDownloaded.push(filename)
        this.queue.push(() => {
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

    processQueueItem(){
        if(!this.queueStarted){
            return
        }
        else if(this.queue.length === 0){
            const fileListFilename = 'textnow-export-file-list.txt'
            this.queueDownload(fileListFilename, 'data:text/plain;charset=utf-8,' + this.filesDownloaded.join("\n"))
            
            this.queueStarted = false
            console.log('Finished exporting. Please make sure all the files listed in ' + fileListFilename + ' finished downloading.')

            return
        }

        // console.log('Remaining files to download: ' + this.queue.length)
        const item = this.queue.pop()
        item()
    }
}

new TextNowExporter()