import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      navLayout="around"
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full',
        month: 'w-full flex flex-wrap items-center justify-center gap-x-2 gap-y-4',
        month_caption: 'flex justify-center items-center',
        caption_label: 'text-sm font-medium',
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'h-10 w-10 bg-transparent !bg-transparent hover:!bg-accent p-0 opacity-70 hover:opacity-100 active:opacity-100 touch-manipulation'
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'h-10 w-10 bg-transparent !bg-transparent hover:!bg-accent p-0 opacity-70 hover:opacity-100 active:opacity-100 touch-manipulation'
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex w-full',
        weekday:
          'text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] text-center',
        week: 'flex w-full mt-2',
        day: 'flex-1 aspect-square text-center text-sm p-0 relative focus-within:relative focus-within:z-20',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'w-full h-full p-0 font-normal aria-selected:opacity-100 touch-manipulation rounded-lg'
        ),
        range_end: 'day-range-end',
        selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        today: 'bg-accent text-accent-foreground',
        outside:
          'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
        disabled: 'text-muted-foreground opacity-50',
        range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
        hidden: 'invisible',
        ...classNames,
      }}
      formatters={{
        formatWeekdayName: (day) => {
          const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
          return weekdays[day.getDay()];
        },
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === 'left') {
            return <ChevronLeft className="h-5 w-5" />;
          }
          return <ChevronRight className="h-5 w-5" />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };