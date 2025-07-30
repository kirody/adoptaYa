import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formattedAge'
})
export class FormattedAgePipe implements PipeTransform {

  transform(value: number, ...args: unknown[]): string {
    let text = '';
    if (value > 1) {
      text = 'años';
    } else {
      text = 'año';
    }

    return value + ' ' + text;
  }

}
