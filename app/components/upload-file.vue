<template lang='pug'>
div.w-full.col-span-2
    label.transition-all.w-full.h-32.flex.flex-col.items-center.justify-center.border-2.border-zinc-300.border-dashed.rounded-lg.cursor-pointer(for='fileInput' class='dark:hover:bg-bray-800 hover:bg-zinc-50 dark:border-zinc-600 dark:hover:border-zinc-500 dark:hover:bg-zinc-700' @dragover.prevent @drop.prevent="handleDrop")
        div.flex.flex-col.items-center.justify-center.pt-5.pb-6
            svg.w-8.h-8.mb-4.text-gray-500(class='dark:text-gray-400' aria-hidden='true' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 16')
                path(stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2')
            p.mb-2.text-sm.text-gray-500(class='dark:text-gray-400')
                span.font-semibold Click to upload 
                |   or 
                span.font-semibold Drag & Drop
            p.text-xs.text-gray-500(class='dark:text-gray-400') Accept only Image, PDF, Word, HWP File (Max. 10MB)
        input.hidden#fileInput(ref='fileInput' type='file' accept='image/*,.pdf,.doc,.docx,.hwp' multiple @change='uploadFile')
</template>

<script setup lang='ts'>
const $toast = useToast()

const emit = defineEmits([
    'upload'
])

function getFileTypeFromName(_fileName: string): string {
    const _extension = _fileName.toLowerCase().split('.').pop()
    switch (_extension) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg'
        case 'png':
            return 'image/png'
        case 'gif':
            return 'image/gif'
        case 'svg':
            return 'image/svg+xml'
        case 'pdf':
            return 'application/pdf'
        case 'doc':
            return 'application/msword'
        case 'docx':
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        case 'hwp':
            return 'application/x-hwp'
        default:
            return 'application/octet-stream'
    }
}


function uploadFile (_event: Event) {
    if((_event.target as HTMLInputElement).files == null) {
        return
    }
    
    const files = (_event.target as HTMLInputElement).files as FileList
    
    for (let _index = 0; _index < files.length; _index++) {
        const _file = files[_index]
        
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/x-hwp',
            'application/haansofthwp',
            'application/vnd.hancom.hwp'
        ]
        
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.pdf', '.doc', '.docx', '.hwp']
        const fileName = _file!.name.toLowerCase()
        const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))
        
        if (!allowedTypes.includes(_file!.type) && !hasValidExtension) {
            $toast.add({
                color: 'error',
                title: 'File type not supported',
                description: `This file type is not supported.<br>${ _file?.name }`
            })
            continue
        }
        
        if (_file!.size > 10 * 1024 * 1024) {
            $toast.add({
                color: 'error',
                title: 'File size error',
                description: `The maximum file size is 10MB.<br>${ _file?.name }`
            })
            continue
        }
        
        const _render = new FileReader()
        _render.onload = (_event) => {
            let _fileType = _file!.type
            if (!_fileType || _fileType === 'application/octet-stream') {
                _fileType = getFileTypeFromName(_file!.name)
            }

            emit('upload', {
                name: _file?.name,
                type: _fileType,
                size: _file?.size,
                data: _event.target?.result
            })

        }
        _render.readAsDataURL(_file!)
    }
}

function handleDrop(_event: DragEvent) {
    _event.preventDefault()
    
    if (!_event.dataTransfer?.files) {
        return
    }
    
    const _files = _event.dataTransfer.files
    
    for (let _index = 0; _index < _files.length; _index++) {
        const _file = _files[_index]
        
        const _allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/x-hwp',
            'application/haansofthwp',
            'application/vnd.hancom.hwp'
        ]
        
        const _allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.pdf', '.doc', '.docx', '.hwp']
        const _fileName = _file!.name.toLowerCase()
        const _hasValidExtension = _allowedExtensions.some(_extension => _fileName.endsWith(_extension))
        
        if (!_allowedTypes.includes(_file!.type) && !_hasValidExtension) {
            $toast.add({
                color: 'error',
                title: 'File type not supported',
                description: `This file type is not supported.<br>${ _file?.name }`
            })
            continue
        }
        
        if (_file!.size > 10 * 1024 * 1024) {
            $toast.add({
                color: 'error',
                title: 'File size error',
                description: `The maximum file size is 10MB.<br>${ _file?.name }`
            })
            continue
        }
        
        const _reader = new FileReader()
        _reader.onload = (_event) => {
            if (_event.target?.result) {
                let _fileType = _file!.type
                if (!_fileType || _fileType === 'application/octet-stream') {
                    _fileType = getFileTypeFromName(_file!.name)
                }
                
                emit('upload', {
                    name: _file?.name,
                    type: _fileType,
                    size: _file?.size,
                    data: _event.target?.result
                })
            }
        }
        _reader.readAsDataURL(_file!)
    }
}
</script>