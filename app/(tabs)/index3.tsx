import { db } from "@/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import {
  useCollectionData,
  useDocument,
  useDocumentData,
} from "react-firebase-hooks/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
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
  createdAt?: Timestamp | null;
}

export default function HomeScreen() {
  const [inputText, setInputText] = useState("");

  const todosCollection = collection(db, "todos");
  const q = query(todosCollection, orderBy("createdAt", "desc"));

  /* ===============================
     useCollectionData 
      // no need   snapshot?.docs.map((doc) => {     to make ts happy
     =============================== */
  const qWithConverter = q.withConverter<Todo>({
    toFirestore(todo: Todo) {
      const { id, ...rest } = todo;
      return rest;
    },
    fromFirestore(snapshot, options) {
      const data = snapshot.data(options) as Omit<Todo, "id">;
      return { id: snapshot.id, ...data };
    },
  });

  const [todosFromUseCollectionData, loadingData] =
    useCollectionData<Todo>(qWithConverter);

  const firstTodoId = todosFromUseCollectionData?.[0]?.id ?? null;

  const firstTodoDocRef = firstTodoId ? doc(db, "todos", firstTodoId) : null;

  const [todoSnapshotFromUseDocument] = useDocument(firstTodoDocRef);

  const firstTodoDocRef2 = firstTodoId
    ? doc(db, "todos", firstTodoId).withConverter<Todo>({
        toFirestore(todo: Todo) {
          const { id, ...rest } = todo;
          return rest;
        },
        fromFirestore(snapshot, options) {
          const data = snapshot.data(options) as Omit<Todo, "id">;
          return { id: snapshot.id, ...data };
        },
      })
    : null;

  const [todoDataFromUseDocumentData] = useDocumentData<Todo>(firstTodoDocRef2);

  /* ---------- CRUD ---------- */

  const createTodo = async () => {
    if (!inputText.trim()) return;

    await addDoc(todosCollection, {
      text: inputText.trim(),
      completed: false,
      createdAt: serverTimestamp(),
    });

    setInputText("");
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    if (!id) return;
    await updateDoc(doc(db, "todos", id), {
      completed: !completed,
    });
  };

  const deleteTodo = async (id: string) => {
    if (!id) return;
    await deleteDoc(doc(db, "todos", id));
  };

  /* ---------- UI ---------- */

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>React Firebase Hooks – Todolist</Text>

        {/* CREATE */}
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="New todo..."
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={createTodo}
          />
          <TouchableOpacity style={styles.btn} onPress={createTodo}>
            <Text style={styles.btnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* useCollectionData */}
        <Section title="todosFromUseCollectionData">
          {loadingData ? (
            <ActivityIndicator />
          ) : (
            todosFromUseCollectionData?.map((todo) => (
              <TodoRow
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
              />
            ))
          )}
        </Section>

        <Section title="todoSnapshotFromUseDocument">
          <Text style={styles.meta}>
            FirstTodo: {todoSnapshotFromUseDocument?.data()?.text ?? "—"}{" "}
            {todoSnapshotFromUseDocument?.data()?.completed === undefined
              ? "—"
              : todoSnapshotFromUseDocument.data()!.completed
              ? "true"
              : "false"}
          </Text>
        </Section>

        {/* useDocumentData */}
        <Section title="todoDataFromUseDocumentData">
          <Text style={styles.meta}>
            FirstTodo: {todoDataFromUseDocumentData?.text ?? "—"}{" "}
            {todoDataFromUseDocumentData?.completed === undefined
              ? "—"
              : todoDataFromUseDocumentData.completed
              ? "true"
              : "false"}
          </Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- components ---------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function TodoRow({
  todo,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <View style={styles.todoRow}>
      <TouchableOpacity
        key={todo.id}
        onPress={() => onToggle(todo.id, todo.completed)}
      >
        <Text style={[styles.todoText, todo.completed && styles.done]}>
          {todo.text}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDelete(todo.id)}>
        <Text style={styles.del}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 16 },
  card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  btn: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "600" },
  todoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  todoText: { fontSize: 16 },
  done: { textDecorationLine: "line-through", color: "#999" },
  del: { color: "#FF3B30", fontWeight: "600" },
  meta: { fontSize: 14, color: "#555", marginBottom: 4 },
});
