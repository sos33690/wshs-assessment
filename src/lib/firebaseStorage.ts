import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Assessment } from '@/types/assessment';

const COLLECTION_NAME = 'assessments';

// Firestore에서 사용할 Assessment 타입 (Timestamp 포함)
interface FirestoreAssessment extends Omit<Assessment, 'date'> {
  date: Timestamp;
}

// YYYY-MM-DD 문자열을 로컬 타임존 기준 Date로 파싱 (UTC 파싱 문제 방지)
const parseDateString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0); // 정오로 설정하여 타임존 이슈 방지
};

// Date 객체를 YYYY-MM-DD 문자열로 변환 (로컬 타임존 기준)
const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Assessment를 Firestore 형식으로 변환
const toFirestore = (assessment: Omit<Assessment, 'id'>): Omit<FirestoreAssessment, 'id'> => ({
  ...assessment,
  date: Timestamp.fromDate(parseDateString(assessment.date))
});

// Firestore 데이터를 Assessment 형식으로 변환
const fromFirestore = (id: string, data: FirestoreAssessment): Assessment => ({
  ...data,
  id,
  date: formatDateToString(data.date.toDate())
});

// 모든 수행평가 가져오기
export const getAssessments = async (): Promise<Assessment[]> => {
  try {
    console.log('🔍 Fetching all assessments from Firestore...');
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    console.log(`✅ Found ${querySnapshot.docs.length} assessments`);
    
    const assessments = querySnapshot.docs.map(doc => {
      const data = fromFirestore(doc.id, doc.data() as FirestoreAssessment);
      console.log('📄 Assessment:', data);
      return data;
    });
    
    return assessments;
  } catch (error) {
    console.error('❌ Error getting assessments:', error);
    return [];
  }
};

// 특정 학년-반의 수행평가 가져오기
export const getAssessmentsByClass = async (grade: number, classNumber: number): Promise<Assessment[]> => {
  try {
    console.log(`🔍 Fetching assessments for ${grade}학년 ${classNumber}반...`);
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where('grade', '==', grade),
      where('classNumber', '==', classNumber)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`✅ Found ${querySnapshot.docs.length} assessments for ${grade}학년 ${classNumber}반`);
    
    const assessments = querySnapshot.docs.map(doc => {
      const data = fromFirestore(doc.id, doc.data() as FirestoreAssessment);
      console.log('📄 Assessment:', data);
      return data;
    });
    
    return assessments;
  } catch (error) {
    console.error('❌ Error getting assessments by class:', error);
    return [];
  }
};

// 수행평가 추가
export const addAssessment = async (assessment: Omit<Assessment, 'id'>): Promise<string> => {
  try {
    console.log('➕ Adding assessment:', assessment);
    const firestoreData = toFirestore(assessment);
    console.log('📤 Firestore data:', firestoreData);
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), firestoreData);
    console.log('✅ Assessment added with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Error adding assessment:', error);
    throw error;
  }
};

// 수행평가 수정
export const updateAssessment = async (id: string, assessment: Omit<Assessment, 'id'>): Promise<void> => {
  try {
    console.log('✏️ Updating assessment:', id, assessment);
    const docRef = doc(db, COLLECTION_NAME, id);
    const firestoreData = toFirestore(assessment);
    await updateDoc(docRef, { ...firestoreData });
    console.log('✅ Assessment updated');
  } catch (error) {
    console.error('❌ Error updating assessment:', error);
    throw error;
  }
};

// 수행평가 삭제
export const deleteAssessment = async (id: string): Promise<void> => {
  try {
    console.log('🗑️ Deleting assessment:', id);
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    console.log('✅ Assessment deleted');
  } catch (error) {
    console.error('❌ Error deleting assessment:', error);
    throw error;
  }
};