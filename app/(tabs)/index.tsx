import { db } from "@/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: any;
}

export default function HomeScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const todosCollection = collection(db, "todos");

  //   点击按钮
  // → Firestore 先写入本地缓存（毫秒级）
  // → onSnapshot 立刻触发（来自本地）
  // → setTodos
  // → UI 立刻更新
  // → 后台同步到云端
  // → 云端确认 / 修正

  // “Firebase Todo 看起来没有 loading，
  // 是因为 UI 根本没等服务器。”

  // Real-time listener for todos   useeffect初始挂载
  useEffect(() => {
    const q = query(todosCollection, orderBy("createdAt", "desc"));
    // onSnapshot 实时监听数据的变化。每当 todos 集合的数据发生变化时，Firestore 会自动触发回调函数。
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const todosData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Todo[];
        setTodos(todosData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching todos:", error);
        Alert.alert("Error", "Failed to load todos");
        setLoading(false);
      }
    );

    return () => unsubscribe();
    //当组件卸载时，useEffect 会自动调用这个 unsubscribe 函数，取消对 Firestore 数据的实时监听。
  }, []);

  console.log("todos", todos);

  // Create a new todo
  const createTodo = async () => {
    if (inputText.trim() === "") {
      Alert.alert("Error", "Please enter a todo item");
      return;
    }

    try {
      await addDoc(todosCollection, {
        text: inputText.trim(),
        completed: false,
        createdAt: new Date(),
      });
      setInputText("");
    } catch (error) {
      console.error("Error adding todo:", error);
      Alert.alert("Error", "Failed to add todo");
    }
  };

  // Update todo completion status
  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      const todoDoc = doc(db, "todos", id);
      await updateDoc(todoDoc, {
        completed: !completed,
      });
    } catch (error) {
      console.error("Error updating todo:", error);
      Alert.alert("Error", "Failed to update todo");
    }
  };

  // Delete a todo
  const deleteTodo = async (id: string) => {
    Alert.alert("Delete Todo", "Are you sure you want to delete this todo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const todoDoc = doc(db, "todos", id);
            await deleteDoc(todoDoc);
          } catch (error) {
            console.error("Error deleting todo:", error);
            Alert.alert("Error", "Failed to delete todo");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Todo List</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter a new todo..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={createTodo}
        />
        <TouchableOpacity style={styles.addButton} onPress={createTodo}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading todos...</Text>
        </View>
      ) : (
        <ScrollView style={styles.todosContainer}>
          {todos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No todos yet. Add one above!</Text>
            </View>
          ) : (
            todos.map((todo) => (
              <View key={todo.id} style={styles.todoItem}>
                <TouchableOpacity
                  style={styles.todoContent}
                  onPress={() => toggleTodo(todo.id, todo.completed)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      todo.completed && styles.checkboxCompleted,
                    ]}
                  >
                    {todo.completed && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text
                    style={[
                      styles.todoText,
                      todo.completed && styles.todoTextCompleted,
                    ]}
                  >
                    {todo.text}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteTodo(todo.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111",
  },
  inputContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#111",
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  todosContainer: {
    flex: 1,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  todoContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxCompleted: {
    backgroundColor: "#007AFF",
  },
  checkmark: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  todoText: {
    flex: 1,
    fontSize: 16,
    color: "#111",
  },
  todoTextCompleted: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
