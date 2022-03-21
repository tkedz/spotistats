import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'removeParenthesis' })
export class RemoveParenthesis implements PipeTransform {
  transform(value: string) {
    const newValue = value.replace(/\(.*?\)/, '');
    return newValue;
  }
}
