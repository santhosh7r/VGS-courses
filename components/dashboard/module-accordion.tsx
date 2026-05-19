'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Layers, BookOpen } from 'lucide-react'
import LessonList from '@/components/dashboard/lesson-list'

interface Lesson {
  id: string
  title: string
  description: string
  is_published: boolean
  order_index: number
  lesson_resources: any[]
}

export interface ModuleGroup {
  id: string
  title: string | null
  lessons: Lesson[]
}

/**
 * Modules as a click-to-expand accordion. Each module shows how many lessons
 * it holds; expanding reveals the lesson list for that module.
 */
export default function ModuleAccordion({
  groups,
  courseId,
}: {
  groups: ModuleGroup[]
  courseId: string
}) {
  // No modules at all — just show the flat lesson list.
  if (groups.length === 1 && !groups[0].title) {
    return <LessonList lessons={groups[0].lessons} courseId={courseId} />
  }

  return (
    <Accordion
      type="multiple"
      defaultValue={groups.length === 1 ? [groups[0].id] : []}
      className="space-y-3"
    >
      {groups.map((g) => (
        <AccordionItem
          key={g.id}
          value={g.id}
          className="border border-border rounded-lg px-4 last:border-b"
        >
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2 font-semibold">
              <Layers className="w-4 h-4 text-primary shrink-0" />
              {g.title || 'Lessons'}
              <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                <BookOpen className="w-3.5 h-3.5" />
                {g.lessons.length} lesson{g.lessons.length !== 1 ? 's' : ''}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <LessonList lessons={g.lessons} courseId={courseId} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
