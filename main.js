function Validator(formSelector) {
    var _this = this;

    function getParent(element, selector) {//Đệ quy
        if(element.parentElement.matches(selector)) {
            return element.parentElement;
        }
        return getParent(element.parentElement, selector);
    }

    var formRules = {};
    var validatorRules = {
        required: function(value) {
            return value ? undefined : 'Vui long nhap truong nay'
        },
        email: function(value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : 'Email khong dung dinh dang'
        },
        min: function(min) {
            return function(value) {
                return value.length >= min ? undefined : `Vui long nhap it nhat ${min} ky tu`
            }
        },
        max: function(max) {
            return function(value) {
                return value.length <= max ? undefined : `Nhap toi da ${max} ky tu`
            }
        }
    };

    //Lấy ra form element trong DOM theo 'formSelector'
    var formElement = document.querySelector(formSelector);

    //Chỉ suử lý khi có element trong dom
    if(formElement) {

        var inputs = formElement.querySelectorAll('[name][rules]');

        for(var input of inputs) {
            var rules = input.getAttribute('rules').split('|');
            for(var rule of rules) {
                var ruleInfo;
                var isRuleHasValue = rule.includes(':');
                
                if(isRuleHasValue) {
                    ruleInfo = rule.split(':');
                    rule = ruleInfo[0];
                }
                var ruleFunc = validatorRules[rule];


                if(isRuleHasValue) {
                    ruleFunc = ruleFunc(ruleInfo[1]);
                }


                if(Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc);
                } else {
                    formRules[input.name] = [validatorRules[rule]];
                }
            }


            // formRules[input.name] = input.getAttribute('rules');

            //Lắng nghe sự kiện để validate (blur, change)
            input.onblur = handleValidate;
            input.oninput = handleClearError;
        }
        //hàm thực hiện validate
        function handleValidate(event) {
            var rules = formRules[event.target.name];
            var errorMessage;

            for(var rule of rules) {
                errorMessage = rule(event.target.value);
                if(errorMessage) break;
            }

            //Nếu có lỗi
            if(errorMessage) {
                var formGroup = getParent(event.target, '.form-group');

                if(formGroup) {
                    formGroup.classList.add('invalid');
                    var formMessage = formGroup.querySelector('.form-message');
                    if(formMessage) {
                        formMessage.innerText = errorMessage;

                    }
                }
            }
            return !errorMessage;
        }

        //Hàm clear message
        function handleClearError(event) {
            var formGroup = getParent(event.target, '.form-group');
            if(formGroup.classList.contains('invalid')) {
                formGroup.classList.remove('invalid');
                var formMessage = formGroup.querySelector('.form-message');
                    if(formMessage) {
                        formMessage.innerText = '';

                    }
            }
        }
    }

    //Xử lý hành vi submit form
    formElement.onsubmit = function(event) {
        event.preventDefault();

        console.log(_this)
        
        var inputs = formElement.querySelectorAll('[name][rules]');
        var isValid = true;

        for(var input of inputs) {
            if(!handleValidate({target: input})) {
                isValid = false;
            }
        }

        if(isValid) {
            if(typeof _this.onSubmit === 'function') {
                var enableInputs = formElement.querySelectorAll('[name]');
                var formValues = Array.from(enableInputs).reduce((values, input) => {
                    switch(input.type) {
                        case 'radio':
                            values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                            break
                        case 'checkbox':
                            if(input.matches(':checked')) {
                                values[input.name] = [];
                                return values;
                            } 
                            if(!Array.isArray(values[input.name])) {
                                values[input.name] = [];
                            }

                            values[input.name].push(input.value);

                            break;
                        case 'file':
                            values[input.name] = input.files;
                            break;
                        default:
                            values[input.name] = input.value;
                    }
                    return values;

                }, {});
                //Gọi lại hàm onsubmit và trả về kèm giá trị của form
                _this.onSubmit(formValues);
            } else {
                formElement.submit();
            }
        }
    }
}