import React, { useState, useEffect, useCallback } from 'react';
import { Todo } from '../types/Todo';
import { todoApi } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { handleApiError } from '../utils/errorHandler';
import LoadingSpinner from '../components/LoadingSpinner';

const TodosPage: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const { showError, showSuccess } = useNotification();

  const loadTodos = useCallback(async () => {
    try {
      const fetchedTodos = await todoApi.getAllTodos();
      setTodos(fetchedTodos);
    } catch (error) {
      const apiError = handleApiError(error);
      showError(apiError.message, 'Todoの読み込みに失敗しました');
      console.error('Error loading todos:', error);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    setSubmitting(true);
    try {
      const newTodo = await todoApi.createTodo(newTodoTitle);
      setTodos([...todos, newTodo]);
      setNewTodoTitle('');
      showSuccess('Todoを追加しました');
    } catch (error) {
      const apiError = handleApiError(error);
      showError(apiError.message, 'Todoの追加に失敗しました');
      console.error('Error creating todo:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTodo = async (id: number, completed: boolean) => {
    setUpdatingIds(prev => new Set(prev).add(id));
    try {
      const updatedTodo = await todoApi.updateTodo(id, { completed });
      setTodos(todos.map(todo => 
        todo.id === id ? updatedTodo : todo
      ));
      showSuccess(completed ? 'Todoを完了にしました' : 'Todoを未完了にしました');
    } catch (error) {
      const apiError = handleApiError(error);
      showError(apiError.message, 'Todoの更新に失敗しました');
      console.error('Error updating todo:', error);
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleDeleteTodo = async (id: number) => {
    setDeletingIds(prev => new Set(prev).add(id));
    try {
      await todoApi.deleteTodo(id);
      setTodos(todos.filter(todo => todo.id !== id));
      showSuccess('Todoを削除しました');
    } catch (error) {
      const apiError = handleApiError(error);
      showError(apiError.message, 'Todoの削除に失敗しました');
      console.error('Error deleting todo:', error);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="todo-app" style={{ textAlign: 'center', padding: '60px 30px' }}>
          <LoadingSpinner size="large" />
          <p style={{ marginTop: '20px', color: '#666' }}>Todoを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="todo-app">
        <h1>Todo アプリ</h1>
        
        <form onSubmit={handleAddTodo} className="todo-form">
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="新しいタスクを入力..."
            className="todo-input"
            disabled={submitting}
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={submitting || !newTodoTitle.trim()}
          >
            {submitting && <LoadingSpinner size="small" color="white" />}
            {submitting ? '追加中...' : '追加'}
          </button>
        </form>

        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className="todo-item">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={(e) => handleToggleTodo(todo.id, e.target.checked)}
                className="todo-checkbox"
                disabled={updatingIds.has(todo.id)}
              />
              <span className={`todo-text ${todo.completed ? 'completed' : ''}`}>
                {todo.title}
                {updatingIds.has(todo.id) && (
                  <LoadingSpinner size="small" className="inline-spinner" />
                )}
              </span>
              <button
                onClick={() => handleDeleteTodo(todo.id)}
                className="btn btn-danger todo-delete"
                disabled={deletingIds.has(todo.id)}
              >
                {deletingIds.has(todo.id) && <LoadingSpinner size="small" color="white" />}
                {deletingIds.has(todo.id) ? '削除中...' : '削除'}
              </button>
            </li>
          ))}
        </ul>

        {todos.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888', marginTop: '30px' }}>
            タスクがありません。新しいタスクを追加してください。
          </p>
        )}
      </div>
    </div>
  );
};

export default TodosPage;