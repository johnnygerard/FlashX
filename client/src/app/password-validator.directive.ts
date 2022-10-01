import { Directive } from '@angular/core';
import {
    AbstractControl, NG_VALIDATORS, ValidationErrors, Validator
} from '@angular/forms';

@Directive({
    selector: '[appPasswordValidator]',
    providers: [{
        provide: NG_VALIDATORS,
        useExisting: PasswordValidatorDirective,
        multi: true
    }]
})
export class PasswordValidatorDirective implements Validator {
    private readonly regExps: { [index: string]: RegExp } = {
        digit: this.buildRegExp(/\d/),
        lowercase: this.buildRegExp(/[a-z]/),
        uppercase: this.buildRegExp(/[A-Z]/),
        symbol: this.buildRegExp(/[!-/:-@[-`{-~]/)
    };

    private buildRegExp(characterClass: RegExp): RegExp {
        return RegExp(`^(?=[^]*?${characterClass.source})`);
    }

    validate(control: AbstractControl<string>): ValidationErrors | null {
        const value = control.value;

        if (value) {
            const errors: ValidationErrors = {};

            for (const key in this.regExps)
                errors[key] = !this.regExps[key].test(value);

            return errors;
        }
        return null;
    }
}
