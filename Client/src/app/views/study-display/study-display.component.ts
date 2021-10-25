import {Component, Inject, Input, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Challenge, ChallengeService } from '../../services/game/challenge.service';
import { Study, StudyService } from '../../services/game/study.service';
import { EndpointsService, Resource} from '../../services/endpoints/endpoints.service';
import { environment } from 'src/environments/environment';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth/auth.service';
import {MatTable} from '@angular/material/table';
import {MatSort} from "@angular/material/sort";


@Component({
  selector: 'app-study-display',
  templateUrl: './study-display.component.html',
  styleUrls: ['./study-display.component.css']
})
export class StudyDisplayComponent implements OnInit {
  study: Study;
  challenges: Challenge[] = [];
  resources: Resource[] = [];
  filteredResources: Resource[] = [];
  createChallenge: boolean;
  verDocumentos: boolean;
  dummyExists: boolean = false;
  searchView: boolean;
  registerLink: string;
  deletingResource: boolean;

  constructor(private router: Router,
              private route: ActivatedRoute,
              private challengeService: ChallengeService,
              private studyService: StudyService,
              private authService: AuthService,
              private toastr: ToastrService,
              private translate: TranslateService,
              public endpointsService: EndpointsService,
              public matDialog: MatDialog
              ) { }

  ngOnInit(): void {
    this.createChallenge = false;
    this.verDocumentos = false;
    this.searchView = false;

    this.studyService.getStudy(this.route.snapshot.paramMap.get('study_id')).subscribe(
      response => {
        this.study = response['study'];
        this.registerLink = environment.frontURL + 'welcome/' + this.study._id;
        console.log(this.route.snapshot.paramMap.get('study_id'))
        this.findDummy();
      },
      err => {
        this.toastr.error(this.translate.instant("STUDY.TOAST.NOT_LOADED_ERROR"), this.translate.instant("CHALLENGE.TOAST.ERROR"), {
          timeOut: 5000,
          positionClass: 'toast-top-center'
        });
      }
    );

    this.challengeService.getChallengesByStudy(this.route.snapshot.paramMap.get('study_id'))
      .subscribe(response => {
        this.challenges = response['challenges'];
    });

    this.endpointsService.getDocuments('*', this.route.snapshot.paramMap.get('study_id'))
      .subscribe((response: Resource[]) => {
        this.resources = response;
        console.log(this.resources);
        this.filteredResources = this.resources.filter(resource => resource.type != 'image');
      })

    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.deletingResource = false;
  }

  users;
  loadingUsers;
  loadUsers(){
    console.log("USER VIEWER")
    this.loadingUsers=true;
    this.studyService.getStudyUserStats(this.study._id).subscribe(
      response => {
        this.users = response.responseArray;
        this.loadingUsers=false;
        console.log(response, 'response')
      },
      err => {
        console.log("ERROR EN LA CARGA")
        this.loadingUsers=false;

      }
    );

    console.log(this.users)

  }

  @ViewChild(MatSort) sort: MatSort;
  ngAfterViewInit() {
    this.users.sort = this.sort;
  }
  columnsToDisplay = ['username', 'challenges', 'lastSession', 'answers'];




  ///

  findDummy(){
    this.authService.findDummy(this.study._id).subscribe(
      response => {
        this.dummyExists = response['user'];
      }
    )
  }

  createDummy(){
    this.authService.signupDummy(this.study._id).subscribe(
      user => {
        this.toastr.success(this.translate.instant("STUDY.TOAST.DUMMY_SUCCESS"), this.translate.instant("STUDY.TOAST.SUCCESS"), {
          timeOut: 5000,
          positionClass: 'toast-top-center'
        });
        this.ngOnInit();
      },
      err => {
        this.toastr.error(this.translate.instant("STUDY.TOAST.DUMMY_ERROR"), this.translate.instant("STUDY.TOAST.ERROR"), {
          timeOut: 5000,
          positionClass: 'toast-top-center'
        });
      }
    )
  }

  renewDummy(){
    this.authService.renewDummy(this.study._id).subscribe(
      user => {
        this.toastr.success(this.translate.instant("STUDY.TOAST.DUMMY_RESET_SUCCESS"), this.translate.instant("STUDY.TOAST.SUCCESS"), {
          timeOut: 5000,
          positionClass: 'toast-top-center'
        });
        this.dummyExists = true;
      },
      err => {
        this.toastr.error(this.translate.instant("STUDY.TOAST.DUMMY_RESET_ERROR"), this.translate.instant("STUDY.TOAST.ERROR"), {
          timeOut: 5000,
          positionClass: 'toast-top-center'
        });
      }
    )
  }

  confirmStudyDelete(id: string){
    confirm(this.translate.instant("ADMIN.STUDIES.DELETE_CONFIRMATION")) && this.deleteStudy(id);
  }

  deleteStudy(id: string){
    this.studyService.deleteStudy(id)
      .subscribe(study => {
        this.toastr.success(this.translate.instant("STUDY.TOAST.SUCCESS_MESSAGE_DELETE"), this.translate.instant("STUDY.TOAST.SUCCESS"), {
          timeOut: 5000,
          positionClass: 'toast-top-center'
        });
        this.router.navigate(['admin_panel']);
      },
      err => {
        this.toastr.error(this.translate.instant("STUDY.TOAST.ERROR_MESSAGE_DELETE"), this.translate.instant("STUDY.TOAST.ERROR"), {
          timeOut: 5000,
          positionClass: 'toast-top-center'
        });
      }
    );
  }

  getChallengeResources(challengeId: string){
    var finalResources = [];
    var filteredResources = this.resources.filter(resource => resource.task[0] === challengeId && resource.type != 'image');
    filteredResources.forEach(resource => finalResources.push(resource));
    return finalResources;
  }

  refreshResources(){
    this.endpointsService.getDocuments('*', this.route.snapshot.paramMap.get('study_id'))
      .subscribe((response: Resource[]) => {
        this.resources = response;
        this.filteredResources = [];
        this.filteredResources = this.resources.filter(resource => resource.type != 'image');
      })
  }

  confirmChallengeDelete(id: string){
    confirm(this.translate.instant("ADMIN.CHALLENGES.DELETE_CONFIRMATION")) && this.deleteChallenge(id);
  }

  deleteChallenge(id: string){
    this.challengeService.deleteChallenge(id)
      .subscribe(challenge => {
        this.challengeService.getChallengesByStudy(this.route.snapshot.paramMap.get('study_id'))
          .subscribe(response => this.challenges = response['challenges']);
        this.toastr.success(this.translate.instant("CHALLENGE.TOAST.SUCCESS_MESSAGE_DELETE"), this.translate.instant("CHALLENGE.TOAST.SUCCESS"), {
          timeOut: 5000,
          positionClass: 'toast-top-center'
        });
      },
      err => {
        this.toastr.error(this.translate.instant("CHALLENGE.TOAST.ERROR_MESSAGE_DELETE"), this.translate.instant("CHALLENGE.TOAST.ERROR"), {
          timeOut: 5000,
          positionClass: 'toast-top-center'
        });
      }
    );
  }

  confirmResourceDelete(resource: Resource){
    confirm(this.translate.instant("ADMIN.CHALLENGES.RESOURCE_DELETE_CONFIRMATION")) && this.deleteResource(resource);
  }

  deleteResource(resource: Resource){
    this.deletingResource = true;
    this.endpointsService.deleteDocument(resource)
      .subscribe(response => {
        this.endpointsService.getDocuments('*', this.route.snapshot.paramMap.get('study_id'))
        .subscribe((response: Resource[]) => {
          this.resources = response;
          this.filteredResources = [];
          this.filteredResources = this.resources.filter(resource => resource.type != 'image');
        })
        this.toastr.success(this.translate.instant("UPLOAD.TOAST.SUCCESS_MESSAGE_DELETE"), this.translate.instant("UPLOAD.TOAST.SUCCESS"), {
          timeOut: 5000,
          positionClass: 'toast-top-center'
        });
        this.deletingResource = false;
      },
      err => {
        this.toastr.error(this.translate.instant("UPLOAD.TOAST.ERROR_MESSAGE_DELETE"), this.translate.instant("UPLOAD.TOAST.ERROR"), {
          timeOut: 5000,
          positionClass: 'toast-top-center'
        });
      }
    );
  }

  updateChallenge(id: string, updatedChallenge: string){
    this.challengeService.putChallenge(id, updatedChallenge)
    .subscribe(challenge => {
      this.challengeService.getChallengesByStudy(this.route.snapshot.paramMap.get('study_id'))
        .subscribe(response => this.challenges = response['challenges']);
        this.toastr.success(this.translate.instant("CHALLENGE.TOAST.SUCCESS_MESSAGE_UPDATE") + challenge['challenge'].question, this.translate.instant("CHALLENGE.TOAST.SUCCESS"), {
          timeOut: 5000,
          positionClass: 'toast-top-center'
        });
      },
      err => {
        this.toastr.error(this.translate.instant("CHALLENGE.TOAST.ERROR_MESSAGE_UPDATE"), this.translate.instant("CHALLENGE.TOAST.ERROR"), {
          timeOut: 5000,
          positionClass: 'toast-top-center'
        });
      }
    );
  }

  showStudyUpdateDialog(): void {
    const dialogRef = this.matDialog.open(StudyUpdateDialogComponent, {
      width: '60%',
      data: this.study
    }).afterClosed()
    .subscribe(() => this.ngOnInit());
  }

  showChallengeUpdateDialog(challenge: Challenge): void {
    const dialogRef = this.matDialog.open(ChallengeUpdateDialogComponent, {
      width: '60%',
      data: challenge
    }).afterClosed()
    .subscribe(() => this.ngOnInit());
  }

  getClass(type){
    if (type=="page"){
      return "webPage";
    }
    else if(type=="video"){
      return "video"
    }
    else if(type=="image"){
      return "image"
    }else{
      return "document"
    }
  }
  getClassQuestion(type){
    if (type=="page"){
      return "CHALLENGE.QUESTION_TYPE.PAGE";
    }
    else if(type=="video"){
      return "CHALLENGE.QUESTION_TYPE.VIDEO"
    }
    else if(type=="image"){
      return "CHALLENGE.QUESTION_TYPE.IMAGE"
    }else{
      return "CHALLENGE.QUESTION_TYPE.DOCUMENT"
    }
  }
  formatDate(date){
    return date.substr(0,10);
  }
  reloadChallenges(){
    this.challengeService.getChallengesByStudy(this.route.snapshot.paramMap.get('study_id'))
      .subscribe(response => {
        this.challenges = response['challenges'];
      });
    this.endpointsService.getDocuments('*', this.route.snapshot.paramMap.get('study_id'))
    .subscribe((response: Resource[]) => {
      this.resources = response;
      console.log(this.resources);
    });
  }
}

@Component({
  selector: 'app-study-update-dialog',
  templateUrl: 'study-update-dialog.component.html',
  styleUrls: ['./study-update-dialog.component.css']
})
export class StudyUpdateDialogComponent implements OnInit{
  studyForm: FormGroup;
  hours: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
  maxPers: number[] = [1, 2, 3, 4, 5];
  minutes: number[] = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  loading: Boolean;
  file: File;

  constructor(@Inject(MAT_DIALOG_DATA)
    public study: Study,
    private formBuilder: FormBuilder,
    private studyService: StudyService,
    private toastr: ToastrService,
    private translate: TranslateService,
    public matDialog: MatDialog) { }

  ngOnInit(): void {
    /*Gets the cooldown in seconds and converts it to hours and minutes*/
    let seconds = this.study.cooldown;
    let hours = Math.trunc(seconds/3600);
    let minutes = Math.trunc(seconds/60)%60;
    console.log(seconds, hours, minutes)
    /*End*/
    this.studyForm = this.formBuilder.group({
      description: [this.study.description, [Validators.minLength(10), Validators.maxLength(250)]],
      name: [this.study.name, [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      hours: [hours || ''],
      minutes: [minutes || ''],
      maxPerInterval: [this.study.max_per_interval || '', Validators.required]
    });
    this.loading = false;
  }

  get studyFormControls(): any {
    return this.studyForm['controls'];
  }

  resetForm() {
    this.studyForm.reset();
  }

  updateStudy(studyId: string){
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
    formData.append('seconds', '0');
    if(study.maxPerInterval){
      formData.append('max_per_interval', study.maxPerInterval);
    }
    if(this.file){
      formData.append('file', this.file);
    }
    /*Check formData values*/
    for (var value of formData.entries()) {
      console.log(value[0]+ ', ' + value[1]);
    }
    /*End check formData values*/
    this.studyService.putStudy(studyId, formData).subscribe(
      study => {
        this.toastr.success(this.translate.instant("STUDY.TOAST.SUCCESS_MESSAGE_UPDATE") + ': ' + study['study'].name, this.translate.instant("STUDY.TOAST.SUCCESS"), {
          timeOut: 5000,
          positionClass: 'toast-top-center'
        });
        this.loading = false;
        this.matDialog.closeAll();
      },
      err => {
        this.toastr.error(this.translate.instant("STUDY.TOAST.ERROR_MESSAGE_UPDATE"), this.translate.instant("STUDY.TOAST.ERROR"), {
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

@Component({
  selector: 'app-challenge-update-dialog',
  templateUrl: 'challenge-update-dialog.component.html',
  styleUrls: ['./challenge-update-dialog.component.css']
})
export class ChallengeUpdateDialogComponent implements OnInit{
  @Input() study: string;
  challengeForm: FormGroup;
  studies: Study[];
  questionOptions = [
    { id: 1, value: 'page', show: "CHALLENGE.FORM.SELECTS.QUESTION_TYPE.WEB_PAGE" },
    { id: 2, value: 'image', show: "CHALLENGE.FORM.SELECTS.QUESTION_TYPE.IMAGE" },
    { id: 3, value: 'book', show: "CHALLENGE.FORM.SELECTS.QUESTION_TYPE.BOOK" },
    { id: 4, value: 'video', show: "CHALLENGE.FORM.SELECTS.QUESTION_TYPE.VIDEO" }
  ];
  answerOptions = [
    { id: 1, value: 'string', show: "CHALLENGE.FORM.SELECTS.ANSWER_TYPE.STRING" },
    { id: 2, value: 'number', show: "CHALLENGE.FORM.SELECTS.ANSWER_TYPE.NUMBER" },
    { id: 3, value: 'url', show: "CHALLENGE.FORM.SELECTS.ANSWER_TYPE.URL" },
    { id: 4, value: 'justify', show: "CHALLENGE.FORM.SELECTS.ANSWER_TYPE.JUSTIFY" }
  ];
  loading: Boolean;

  constructor(@Inject(MAT_DIALOG_DATA)
    public challenge: Challenge,
    private formBuilder: FormBuilder,
    private router: Router,
    private challengeService: ChallengeService,
    private studyService: StudyService,
    private toastr: ToastrService,
    private translate: TranslateService,
    public matDialog: MatDialog) { }

  ngOnInit(): void {

    this.challengeForm = this.formBuilder.group({
      question: [this.challenge.question, [Validators.required, Validators.minLength(10), Validators.maxLength(300)]],
      question_type: [this.challenge.question_type, Validators.required],
      seconds: [this.challenge.seconds, [Validators.required, Validators.maxLength(3), Validators.min(30)]],
      max_attempts: [this.challenge.max_attempts, [Validators.required, Validators.maxLength(2), Validators.min(1)]],
      hint: [this.challenge.hint, [Validators.minLength(5), Validators.maxLength(100)]],
      answer_type: [this.challenge.answer_type, [Validators.minLength(3), Validators.maxLength(50)]],
      answer: [this.challenge.answer, [Validators.required, Validators.minLength(1), Validators.maxLength(300)]],
    });

    this.studyService.getStudies().subscribe(
      response => {
        this.studies = response['studys'];
      },
      err => {
        this.toastr.error(this.translate.instant("STUDY.TOAST.NOT_LOADED_MULTIPLE_ERROR"), this.translate.instant("CHALLENGE.TOAST.ERROR"), {
          timeOut: 5000,
          positionClass: 'toast-top-center'
        });
      }
    );

    this.loading = false;
  }

  get challengeFormControls(): any {
    return this.challengeForm['controls'];
  }

  updateChallenge(challengeId: string){
    this.loading = true;
    let challenge = this.challengeForm.value;
    challenge.study = this.challenge.study;
    console.log(challenge);
    this.challengeService.putChallenge(challengeId, challenge).subscribe(
      challenge => {
        this.toastr.success(this.translate.instant("CHALLENGE.TOAST.SUCCESS_MESSAGE_UPDATE") + ': ' + challenge['challenge'].question, this.translate.instant("CHALLENGE.TOAST.SUCCESS"), {
          timeOut: 5000,
          positionClass: 'toast-top-center'
        });
        this.loading = false;
        this.matDialog.closeAll();
      },
      err => {
        this.toastr.error(this.translate.instant("CHALLENGE.TOAST.ERROR_MESSAGE_UPDATE"), this.translate.instant("CHALLENGE.TOAST.ERROR"), {
          timeOut: 5000,
          positionClass: 'toast-top-center'
        });
      }
    );
  }
}
