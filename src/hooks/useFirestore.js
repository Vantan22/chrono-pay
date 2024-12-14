import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase/config";

export const useFirestore = (collectionName) => {
  const add = async (data) => {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  };

  const update = async (docId, data) => {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, data);
  };

  const remove = async (docId) => {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  };

  const getAll = async (conditions = [], sortBy = null) => {
    let q = collection(db, collectionName);

    if (conditions.length) {
      conditions.forEach((condition) => {
        q = query(
          q,
          where(condition.field, condition.operator, condition.value)
        );
      });
    }

    if (sortBy) {
      q = query(q, orderBy(sortBy.field, sortBy.direction));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  };

  return { add, update, remove, getAll };
};
