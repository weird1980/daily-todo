import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard.jsx';
import { useT } from '../i18n/index.jsx';

function SortableTask({ task, categories, onStatusChange, onDateChange }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box ref={setNodeRef} style={style} {...attributes}>
      <TaskCard
        task={task}
        categories={categories}
        onStatusChange={onStatusChange}
        onDateChange={onDateChange}
        dragHandleProps={listeners}
      />
    </Box>
  );
}

export default function TaskList({ tasks, categories, onStatusChange, onDateChange, onReorder }) {
  const { t } = useT();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(active.id, over.id);
    }
  };

  if (tasks.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          {t('no_tasks_today')}
        </Typography>
      </Box>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map((task) => (
          <SortableTask
            key={task.id}
            task={task}
            categories={categories}
            onStatusChange={onStatusChange}
            onDateChange={onDateChange}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
