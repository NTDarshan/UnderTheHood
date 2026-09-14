import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { CrudHero } from '../components/crud-hero/crud-hero';
import { WhyCrudExists } from '../components/why-crud-exists/why-crud-exists';
import { CrudVsDatabaseRestHttp } from '../components/crud-vs-database-rest-http/crud-vs-database-rest-http';
import { CrudThroughBackend } from '../components/crud-through-backend/crud-through-backend';
import { CrudPlaygroundCreate } from '../components/crud-playground-create/crud-playground-create';
import { CrudPlaygroundRead } from '../components/crud-playground-read/crud-playground-read';
import { CrudPlaygroundUpdate } from '../components/crud-playground-update/crud-playground-update';
import { CrudPlaygroundDelete } from '../components/crud-playground-delete/crud-playground-delete';
import { CrudRestTable } from '../components/crud-rest-table/crud-rest-table';
import { CrudDomainActions } from '../components/crud-domain-actions/crud-domain-actions';
import { CrudValidation } from '../components/crud-validation/crud-validation';
import { CrudFailureLab } from '../components/crud-failure-lab/crud-failure-lab';
import { CrudConcurrency } from '../components/crud-concurrency/crud-concurrency';
import { CrudDatabaseMapping } from '../components/crud-database-mapping/crud-database-mapping';
import { CrudRealWorldExamples } from '../components/crud-real-world-examples/crud-real-world-examples';
import { CrudFinalMentalModel } from '../components/crud-final-mental-model/crud-final-mental-model';
import { BreakTheCrudApi } from '../components/break-the-crud-api/break-the-crud-api';

@Component({
  selector: 'app-crud-page',
  standalone: true,
  imports: [
    RouterLink,
    CrudHero,
    WhyCrudExists,
    CrudVsDatabaseRestHttp,
    CrudThroughBackend,
    CrudPlaygroundCreate,
    CrudPlaygroundRead,
    CrudPlaygroundUpdate,
    CrudPlaygroundDelete,
    CrudRestTable,
    CrudDomainActions,
    CrudValidation,
    CrudFailureLab,
    CrudConcurrency,
    CrudDatabaseMapping,
    CrudRealWorldExamples,
    CrudFinalMentalModel,
    BreakTheCrudApi,
  ],
  templateUrl: './crud-page.html',
  styleUrl: './crud-page.css',
})
export class CrudPage {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    this.titleService.setTitle('UnderTheHood — CRUD, the Four Operations Behind Almost Every Feature');
    this.meta.updateTag({
      name: 'description',
      content:
        'Manage a live Books app and watch every Create, Read, Update and Delete travel through the controller, service, repository and database underneath — then design your own Books API.',
    });
  }
}
