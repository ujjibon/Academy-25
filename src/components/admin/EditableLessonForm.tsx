
'use client';

import { type Lesson, type Quiz } from '@/lib/data-provider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card } from '../ui/card';

interface EditableLessonFormProps {
  lesson: Lesson;
  setLesson?: React.Dispatch<React.SetStateAction<Lesson | null>>; // Make optional for course editor
  onLessonChange: (lessonIndex: number, updatedLesson: Lesson) => void;
  lessonIndex: number;
}

export function EditableLessonForm({ lesson, setLesson, onLessonChange, lessonIndex }: EditableLessonFormProps) {
  
  const handleLessonChange = (field: keyof Lesson, value: any) => {
    const updatedLesson = { ...lesson, [field]: value };
    onLessonChange(lessonIndex, updatedLesson);
    setLesson?.(updatedLesson);
  };
  
  const handleIntroductionChange = (field: 'text' | 'videoUrl', value: string) => {
    const updatedLesson = { ...lesson, introduction: { ...lesson.introduction, [field]: value } };
    onLessonChange(lessonIndex, updatedLesson);
    setLesson?.(updatedLesson);
  };

  const handleProjectChange = (field: 'title' | 'description', value: string) => {
    const updatedLesson = { ...lesson, project: { ...lesson.project, [field]: value } };
    onLessonChange(lessonIndex, updatedLesson);
    setLesson?.(updatedLesson);
  };
  
  const handleQuizChange = (quizType: 'practice' | 'assessment', questionIndex: number, field: string, value: any) => {
     const newState = JSON.parse(JSON.stringify(lesson)); // Deep copy
     newState[quizType].questions[questionIndex][field] = value;
     onLessonChange(lessonIndex, newState);
     setLesson?.(newState);
  };

  const handleOptionChange = (quizType: 'practice' | 'assessment', questionIndex: number, optionIndex: number, value: string) => {
    const newState = JSON.parse(JSON.stringify(lesson)); // Deep copy
    newState[quizType].questions[questionIndex].options[optionIndex] = value;
    onLessonChange(lessonIndex, newState);
    setLesson?.(newState);
  }

  const addQuestion = (quizType: 'practice' | 'assessment') => {
    const newQuestion = {
        question: 'New Question',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A'
    };
    const newState = JSON.parse(JSON.stringify(lesson)); // Deep copy
    newState[quizType].questions.push(newQuestion);
    onLessonChange(lessonIndex, newState);
    setLesson?.(newState);
  }

  const removeQuestion = (quizType: 'practice' | 'assessment', questionIndex: number) => {
    const newState = JSON.parse(JSON.stringify(lesson)); // Deep copy
    newState[quizType].questions.splice(questionIndex, 1);
    onLessonChange(lessonIndex, newState);
    setLesson?.(newState);
  }


  const renderQuizEditor = (quiz: Quiz, quizType: 'practice' | 'assessment') => (
    <div className="space-y-4">
        {quiz.questions.map((q, i) => (
            <Card key={`${quizType}-${lessonIndex}-${i}`} className="p-4 bg-muted/50">
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                       <Label htmlFor={`${quizType}-q-${lessonIndex}-${i}`}>Question {i + 1}</Label>
                       <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeQuestion(quizType, i)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                       </Button>
                    </div>
                    <Textarea 
                      id={`${quizType}-q-${lessonIndex}-${i}`}
                      value={q.question} 
                      onChange={e => handleQuizChange(quizType, i, 'question', e.target.value)}
                      className="bg-background"
                    />
                    
                    <Label>Options</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, j) => (
                             <Input 
                                key={j}
                                value={opt}
                                onChange={e => handleOptionChange(quizType, i, j, e.target.value)}
                                className="bg-background"
                             />
                        ))}
                    </div>

                    <Label htmlFor={`${quizType}-a-${lessonIndex}-${i}`}>Correct Answer</Label>
                     <Input 
                      id={`${quizType}-a-${lessonIndex}-${i}`}
                      value={q.correctAnswer} 
                      onChange={e => handleQuizChange(quizType, i, 'correctAnswer', e.target.value)}
                      className="bg-background"
                    />
                </div>
            </Card>
        ))}
         <Button variant="outline" onClick={() => addQuestion(quizType)}>Add Question</Button>
    </div>
  )

  return (
    <div className="space-y-6">
        <div className="space-y-2">
            <Label htmlFor={`lesson-title-${lessonIndex}`}>Lesson Title</Label>
            <Input id={`lesson-title-${lessonIndex}`} value={lesson.title} onChange={e => handleLessonChange('title', e.target.value)} />
        </div>
         <div className="space-y-2">
            <Label htmlFor={`lesson-duration-${lessonIndex}`}>Duration (minutes)</Label>
            <Input id={`lesson-duration-${lessonIndex}`} type="number" value={lesson.duration} onChange={e => handleLessonChange('duration', parseInt(e.target.value, 10))} />
        </div>
        
        <Accordion type="multiple" defaultValue={['intro']} className="w-full">
            <AccordionItem value="intro">
                <AccordionTrigger>Introduction</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                     <div className="space-y-2">
                        <Label htmlFor={`intro-text-${lessonIndex}`}>Introduction Text</Label>
                        <Textarea id={`intro-text-${lessonIndex}`} value={lesson.introduction.text} onChange={e => handleIntroductionChange('text', e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor={`intro-video-${lessonIndex}`}>Video URL</Label>
                        <Input id={`intro-video-${lessonIndex}`} value={lesson.introduction.videoUrl} onChange={e => handleIntroductionChange('videoUrl', e.target.value)} />
                    </div>
                </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="practice">
                <AccordionTrigger>Practice Questions</AccordionTrigger>
                <AccordionContent className="pt-4">
                    {renderQuizEditor(lesson.practice, 'practice')}
                </AccordionContent>
            </AccordionItem>

             <AccordionItem value="project">
                <AccordionTrigger>Project</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                     <div className="space-y-2">
                        <Label htmlFor={`project-title-${lessonIndex}`}>Project Title</Label>
                        <Input id={`project-title-${lessonIndex}`} value={lesson.project.title} onChange={e => handleProjectChange('title', e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor={`project-desc-${lessonIndex}`}>Project Description</Label>
                        <Textarea id={`project-desc-${lessonIndex}`} value={lesson.project.description} onChange={e => handleProjectChange('description', e.target.value)} />
                    </div>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="assessment">
                <AccordionTrigger>Assessment Questions</AccordionTrigger>
                <AccordionContent className="pt-4">
                     {renderQuizEditor(lesson.assessment, 'assessment')}
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </div>
  );
}
