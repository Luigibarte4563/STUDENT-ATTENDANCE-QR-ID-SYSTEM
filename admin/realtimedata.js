import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, Timestamp, doc, setDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";

// Enable Firebase debug logging
setLogLevel('debug');

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyDq64gpsq2NzC7EA1V00WZ-yYGzHSKYMLA",
    authDomain: "studentattendanceqridsys.firebaseapp.com",
    databaseURL: "https://studentattendanceqridsys-default-rtdb.firebaseio.com",
    projectId: "studentattendanceqridsys",
    storageBucket: "studentattendanceqridsys.firebasestorage.app",
    messagingSenderId: "666194808312",
    appId: "1:666194808312:web:4b919a6900833ce51b9a0d",
    measurementId: "G-XFK13STCJK"
};

let app, auth, db, userId = null;

const showModal = (message) => {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-modal').classList.remove('hidden');
    document.getElementById('error-modal').classList.add('flex');
};

const hideLoading = () => {
    document.getElementById('loading-indicator').classList.add('hidden');
};

// Initialize Firebase and authenticate user
async function setupFirebase() {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);

        // Anonymous sign-in for testing
        const user = await new Promise((resolve) => {
            onAuthStateChanged(auth, async (u) => {
                if (u) {
                    userId = u.uid;
                    resolve(u);
                } else {
                    const anon = await signInAnonymously(auth);
                    userId = anon.user.uid;
                    resolve(anon.user);
                }
            });
        });

        document.getElementById('user-info').textContent = `Authenticated User ID: ${userId}`;
        startRealtimeListeners();

    } catch (error) {
        console.error("Firebase Initialization or Authentication Error:", error);
        showModal(`Firebase Initialization Error: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// --- REALTIME LISTENERS ---
function startRealtimeListeners() {
    if (!db || !userId) return;

    const appId = "default-app"; // or dynamically get from environment
    const studentsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/students`);
    const teachersCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/teachers`);

    // Listen for students
    onSnapshot(studentsCollectionRef, (snapshot) => {
        const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateStudentStats(students);
    }, (error) => {
        console.error("Error fetching students:", error);
        showModal("Failed to load student data.");
    });

    // Listen for teachers
    onSnapshot(teachersCollectionRef, (snapshot) => {
        const teachers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateTeacherStats(teachers);
    }, (error) => {
        console.error("Error fetching teachers:", error);
        showModal("Failed to load teacher data.");
    });
}

// --- STATS UPDATE FUNCTIONS ---
function updateStudentStats(students) {
    const total = students.length;
    const present = students.filter(s => s.lastCheckIn && isToday(s.lastCheckIn)).length;
    const absent = total - present;

    document.getElementById('total-students').textContent = total;
    document.getElementById('present-today').textContent = present;
    document.getElementById('absent-today').textContent = absent;
}

function updateTeacherStats(teachers) {
    document.getElementById('total-teachers').textContent = teachers.length;
}

const isToday = (firebaseTimestamp) => {
    if (!firebaseTimestamp) return false;
    const date = firebaseTimestamp.toDate();
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
};

// Start Firebase when window loads
window.onload = setupFirebase;