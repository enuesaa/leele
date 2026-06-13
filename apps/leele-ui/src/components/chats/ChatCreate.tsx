import { useMutation } from 'urql'
import { graphql } from 'gql.tada'

const CreateNoteMutation = graphql(`
  mutation ($channel: String!, $message: String!) {
    createNote(channel: $channel, message: $message) {
      id
      message
    }
  }
`)

export function ChatCreate() {
  const [{ fetching, error }, createNote] = useMutation(CreateNoteMutation)

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const message = formData.get('message')?.toString().trim()
    if (!message) {
      return
    }

    const res = await createNote({
      channel: 'general',
      message,
    })

    if (!res.error) {
      form.reset()
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-2'>
      <div className='flex items-center gap-2'>
        <input
          type='text'
          name='message'
          placeholder='メッセージを入力'
          className='flex-1 rounded-md border border-[#bbb] bg-white/40 px-3 py-1.5 text-sm text-[#1a1a1a] placeholder:text-[#1a1a1a]/40 transition-colors focus:border-[#888] focus:outline-none'
        />
        <button
          type='submit'
          disabled={fetching}
          className='rounded-md border border-[#bbb] px-3 py-1.5 text-sm text-[#1a1a1a] transition-colors hover:bg-[#bbb] disabled:cursor-not-allowed disabled:opacity-50'
        >
          送信
        </button>
      </div>
      {error && <p className='text-sm text-[#1a1a1a]/60'>Err: {error.message}</p>}
    </form>
  )
}
