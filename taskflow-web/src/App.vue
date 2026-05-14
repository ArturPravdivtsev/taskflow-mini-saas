<script setup>
import { ref, onMounted } from "vue";

const tasks = ref([]);
const newTask = ref("");

const loadTasks = async () => {
  const res = await fetch("/api/tasks");
  tasks.value = await res.json();
};

const addTask = async () => {
  await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: newTask.value }),
  });

  newTask.value = "";
  loadTasks();
};

onMounted(loadTasks);
</script>

<template>
  <div style="max-width: 500px; margin: 40px auto;">
    <h1>TaskFlow</h1>

    <input v-model="newTask" placeholder="New task..." />
    <button @click="addTask">Add</button>

    <ul>
      <li v-for="t in tasks" :key="t.id">
        {{ t.title }}
      </li>
    </ul>
  </div>
</template>
