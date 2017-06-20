// tslint:disable:no-const-keyword
// tslint:disable:prefer-const
const btnLike = document.getElementById('btnLike') as HTMLButtonElement
const btnDislike = document.getElementById('btnDislike') as HTMLButtonElement
const btnComment = document.getElementById('btnComment') as HTMLButtonElement
const inComment = document.getElementById('inComment') as HTMLTextAreaElement
const inEmail = document.getElementById('inEmail') as HTMLInputElement
const inName = document.getElementById('inName') as HTMLInputElement
const tagLike = document.getElementById('tagLike') as HTMLElement
const tagDislike = document.getElementById('tagDislike') as HTMLElement

const id = 'POST_ID__WILL_BE_REPLACED'
const locale = 'POST_LOCALE__WILL_BE_REPLACED'

const fmtNum = new Intl.NumberFormat(locale)

btnLike.onclick = e => {
  if (inEmail.value !== '') {
    const ajax = new XMLHttpRequest()
    ajax.open('GET', document.baseURI + '/dxapi', true)
    ajax.send({ id: id, locale: locale, like: inEmail.value })
    ajax.onreadystatechange = () => {
      if (ajax.readyState === XMLHttpRequest.DONE && ajax.status === 200) {
        const dynamicData: { likes: number } = JSON.parse(ajax.responseText)
        tagLike.innerText = fmtNum.format(dynamicData.likes)
      }
    }
  }
}

btnDislike.onclick = e => {
  if (inEmail.value !== '') {
    const ajax = new XMLHttpRequest()
    ajax.open('GET', document.baseURI + '/dxapi', true)
    ajax.send({ id: id, locale: locale, dislike: inEmail.value })
    ajax.onreadystatechange = () => {
      if (ajax.readyState === XMLHttpRequest.DONE && ajax.status === 200) {
        const dynamicData: { dislikes: number } = JSON.parse(ajax.responseText)
        tagDislike.innerText = fmtNum.format(dynamicData.dislikes)
      }
    }
  }
}

btnComment.onclick = e => {
  if (inEmail.value !== '' && inComment.value !== '') {
    const ajax = new XMLHttpRequest()
    ajax.open('GET', document.baseURI + '/dxapi', true)
    ajax.send({
      id: id, locale: locale,
      comment: {
        email: inEmail.value,
        body: inComment.value,
        name: inName.value,
        time: new Date()
      }
    })
    ajax.onreadystatechange = () => {
      if (ajax.readyState === XMLHttpRequest.DONE && ajax.status === 200) {
        window.location.reload(true)
      }
    }
  }
}
