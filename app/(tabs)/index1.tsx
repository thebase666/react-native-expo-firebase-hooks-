import { db } from "@/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { useState } from "react";
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
  createdAt: Timestamp;
}

export default function HomeScreen() {
  const [inputText, setInputText] = useState("");
  // const [loading, setLoading] = useState(true); // 不需要这两个
  // const [todos, setTodos] = useState<Todo[]>([]);

  /** Firestore collection + query */
  const todosCollection = collection(db, "todos");
  const q = query(todosCollection, orderBy("createdAt", "desc"));

  /** 🔥 react-firebase-hooks */
  const [snapshot, loading, error] = useCollection(q);

  /** 派生 todos（不再 useState + setTodos） */
  const todos: Todo[] =
    snapshot?.docs.map((doc) => {
      console.log("todoDoc", doc);
      console.log("todoDocId", doc.id); // Firestore doc id not in d.data()

      console.log("todoDocData", doc.data());

      const data = doc.data(); // data（） get data
      return {
        id: doc.id,
        text: data.text,
        completed: data.completed,
        createdAt: data.createdAt,
      } as Todo;
    }) ?? [];

  /** Create */
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
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to add todo");
    }
  };

  /** Update */
  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      await updateDoc(doc(db, "todos", id), {
        completed: !completed,
      });
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update todo");
    }
  };

  /** Delete */
  const deleteTodo = (id: string) => {
    Alert.alert("Delete Todo", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "todos", id));
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to delete todo");
          }
        },
      },
    ]);
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Error loading todos</Text>
      </SafeAreaView>
    );
  }

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

/* ---------------- styles ---------------- */

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
