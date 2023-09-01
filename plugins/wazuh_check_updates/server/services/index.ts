import axios from 'axios'

export const getUpdate = async (id: number) => {
    try {
        const todo = (await axios.get(`https://jsonplaceholder.typicode.com/todos/${id}`)).data

        return todo;
    }
    catch (e) {
        console.log(e)
    }
}

export const getUpdateList = async () => {
    try {
        const todo = (await axios.get('https://jsonplaceholder.typicode.com/todos')).data

        return todo;
    }
    catch (e) {
        console.log(e)
    }
}