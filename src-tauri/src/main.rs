// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Todo {
    id: i64,
    text: String,
    completed: bool,
}

struct AppState {
    todos: Mutex<Vec<Todo>>,
}

#[tauri::command]
fn get_todos(state: State<AppState>) -> Result<Vec<Todo>, String> {
    let todos = state.todos.lock().unwrap();
    Ok(todos.clone())
}

#[tauri::command]
fn add_todo(todo: Todo, state: State<AppState>) -> Result<(), String> {
    let mut todos = state.todos.lock().unwrap();
    todos.push(todo);
    Ok(())
}

#[tauri::command]
fn toggle_todo(id: i64, state: State<AppState>) -> Result<(), String> {
    let mut todos = state.todos.lock().unwrap();
    if let Some(todo) = todos.iter_mut().find(|t| t.id == id) {
        todo.completed = !todo.completed;
        Ok(())
    } else {
        Err("Todo not found".to_string())
    }
}

#[tauri::command]
fn delete_todo(id: i64, state: State<AppState>) -> Result<(), String> {
    let mut todos = state.todos.lock().unwrap();
    todos.retain(|t| t.id != id);
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            todos: Mutex::new(Vec::new()),
        })
        .invoke_handler(tauri::generate_handler![
            get_todos,
            add_todo,
            toggle_todo,
            delete_todo
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
