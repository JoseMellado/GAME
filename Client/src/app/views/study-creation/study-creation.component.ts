import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StudyService } from '../../services/game/study.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-study-creation',
  templateUrl: './study-creation.component.html',
  styleUrls: ['./study-creation.component.css']
})
export class StudyCreationComponent implements OnInit {
  studyForm: FormGroup;
  hours: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
  maxPers: number[] = [1, 2, 3, 4, 5];
  minutes: number[] = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  loading: boolean;
  file: File;

  constructor(
    private formBuilder: FormBuilder,
    private studyService: StudyService,
    private toastr: ToastrService,
    private translate: TranslateService,
    private router: Router,
    private authService: AuthService) { }

  ngOnInit(): void {

    this.studyForm = this.formBuilder.group({
      description: ['', [Validators.minLength(3), Validators.maxLength(250)]],
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      hours: [''],
      minutes: [''],
      maxPerInterval: [''],
    });
    this.loading = false;
  }

  get studyFormControls(): any {
    return this.studyForm['controls'];
  }

  resetForm() {
    this.studyForm.reset();
  }

  createStudy(){
    this.loading = true;
    let study = this.studyForm.value;
    let formData = new FormData();
    formData.append('name', study.name);
    if(study.description){
      formData.append('description', study.description);
    }
    if(study.hours !== ''){
      formData.append('hours', study.hours.toString());
    }else{
      formData.append('hours', '0');
    }
    if(study.minutes !== ''){
      formData.append('minutes', study.minutes.toString());
    }else{
      formData.append('minutes', '0');
    }
    if(study.maxPerInterval){
      formData.append('max_per_interval', study.maxPerInterval)
    }
    formData.append('seconds', '0');
    if(this.file){
      formData.append('file', this.file);
    }
    this.studyService.postStudy(formData).subscribe(
      study => {
        this.authService.signupDummy(study._id).subscribe(
          user => {
            this.toastr.success(this.translate.instant("STUDY.TOAST.SUCCESS_MESSAGE") + ': ' + study['study'].name, this.translate.instant("STUDY.TOAST.SUCCESS"), {
              timeOut: 5000,
              positionClass: 'toast-top-center'
            });
            this.resetForm();
            this.loading = false;
            this.router.navigate(['admin_panel']);
          },
          err => {
            this.toastr.error(this.translate.instant("STUDY.TOAST.ERROR_MESSAGE"), this.translate.instant("STUDY.TOAST.ERROR"), {
              timeOut: 5000,
              positionClass: 'toast-top-center'
            });
          }
        )
      },
      err => {
        this.toastr.error(this.translate.instant("STUDY.TOAST.ERROR_MESSAGE"), this.translate.instant("STUDY.TOAST.ERROR"), {
          timeOut: 5000,
          positionClass: 'toast-top-center'
        });
      }
    );
  }

  handleFileInput(files: FileList) {
    this.file = files.item(0);
  }
}
