import { useMutation } from 'urql'
import { graphql } from 'gql.tada'

const CreateNoteMutation = graphql(`
  mutation ($message: String!) {
    createNote(message: $message) {
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
    const res = await createNote({ message })
    if (!res.error) {
      form.reset()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type='text' name='message' placeholder='message' />
      <button type='submit' disabled={fetching}>送信</button>
      {error && <p>Err: {error.message}</p>}
    </form>
  )
}
