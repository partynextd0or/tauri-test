'use client'

import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/tauri'

interface Todo {
  id: number
  text: string
  completed: boolean
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTauri, setIsTauri] = useState(false)

  useEffect(() => {
    // Check if running in Tauri
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      setIsTauri(true)
      loadTodos()
    } else {
      // Load from localStorage in browser mode
      const saved = localStorage.getItem('todos')
      if (saved) {
        setTodos(JSON.parse(saved))
      }
    }
  }, [])

  const loadTodos = async () => {
    try {
      const loadedTodos = await invoke<Todo[]>('get_todos')
      setTodos(loadedTodos)
    } catch (error) {
      console.error('Failed to load todos:', error)
    }
  }

  const saveTodosToStorage = (newTodos: Todo[]) => {
    if (!isTauri) {
      localStorage.setItem('todos', JSON.stringify(newTodos))
    }
  }

  const addTodo = async () => {
    if (!inputValue.trim()) return

    const newTodo: Todo = {
      id: Date.now(),
      text: inputValue,
      completed: false
    }

    if (isTauri) {
      try {
        await invoke('add_todo', { todo: newTodo })
        await loadTodos()
      } catch (error) {
        console.error('Failed to add todo:', error)
      }
    } else {
      const newTodos = [...todos, newTodo]
      setTodos(newTodos)
      saveTodosToStorage(newTodos)
    }

    setInputValue('')
  }

  const toggleTodo = async (id: number) => {
    if (isTauri) {
      try {
        await invoke('toggle_todo', { id })
        await loadTodos()
      } catch (error) {
        console.error('Failed to toggle todo:', error)
      }
    } else {
      const newTodos = todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
      setTodos(newTodos)
      saveTodosToStorage(newTodos)
    }
  }

  const deleteTodo = async (id: number) => {
    if (isTauri) {
      try {
        await invoke('delete_todo', { id })
        await loadTodos()
      } catch (error) {
        console.error('Failed to delete todo:', error)
      }
    } else {
      const newTodos = todos.filter(todo => todo.id !== id)
      setTodos(newTodos)
      saveTodosToStorage(newTodos)
    }
  }

  return (
    <main className="min-h-screen p-6 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
              My Tasks
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isTauri ? 'Native Application' : 'Browser Version'}
            </p>
          </div>

          <div className="flex gap-3 mb-8">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              placeholder="Add a new task..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-gray-900"
            />
            <button
              onClick={addTodo}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors duration-150"
            >
              Add
            </button>
          </div>

          <div className="space-y-2">
            {todos.length === 0 ? (
              <p className="text-center text-gray-400 dark:text-gray-600 py-12">
                No tasks yet. Create your first task above.
              </p>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    className="w-5 h-5 text-blue-600 rounded accent-blue-600 cursor-pointer"
                  />
                  <span
                    className={`flex-1 ${
                      todo.completed
                        ? 'line-through text-gray-400 dark:text-gray-600'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {todo.text}
                  </span>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="px-3 py-1 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors duration-150"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>

          {todos.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Total: {todos.length}</span>
              <span>Completed: {todos.filter(t => t.completed).length}</span>
              <span>Remaining: {todos.filter(t => !t.completed).length}</span>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
